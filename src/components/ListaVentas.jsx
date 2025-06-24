import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Trash, XCircle, Download, LoaderCircle, Eye } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { jsPDF } from "jspdf";
import exportarBoletoDOCX from "./boletos/exportarBoletoDOCX";

export default function ListaVentas() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmarId, setConfirmarId] = useState(null);
  const [detalleId, setDetalleId] = useState(null);

  // Filtros y paginación
  const [filtroNombre, setFiltroNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 5;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ventasSnap, clientesSnap, vehiculosSnap, vehiculosPartePagoSnap] =
        await Promise.all([
          getDocs(collection(db, "ventas")),
          getDocs(collection(db, "clientes")),
          getDocs(collection(db, "vehiculos")),
          getDocs(collection(db, "vehiculosPartePago")), // <-- traer esta colección
        ]);

      const listaClientes = clientesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const listaVehiculos = vehiculosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Map con los vehiculos de parte de pago por id para acceso rápido
      const mapaVehiculosPartePago = {};
      vehiculosPartePagoSnap.docs.forEach((doc) => {
        mapaVehiculosPartePago[doc.id] = doc.data();
      });

      const listaVentas = ventasSnap.docs
        .map((doc) => {
          const data = doc.data();
          const cliente = listaClientes.find((c) => c.id === data.clienteId);
          const vehiculo = listaVehiculos.find((v) => v.id === data.vehiculoId);
          const vehiculoPartePago =
            data.vehiculoPartePagoId &&
            mapaVehiculosPartePago[data.vehiculoPartePagoId]
              ? mapaVehiculosPartePago[data.vehiculoPartePagoId]
              : null;

          return {
            id: doc.id,
            ...data,
            clienteNombre: cliente?.nombre || "Cliente no encontrado",
            clienteApellido: cliente?.apellido || "",
            dniCliente: cliente?.dni || "",
            vehiculoInfo: vehiculo
              ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
              : "Vehículo no encontrado",
            patenteVehiculo: vehiculo?.patente || "",
            vehiculoPartePago, // agregar aquí el objeto completo de parte de pago
            fechaObj: data.fecha?.toDate ? data.fecha.toDate() : new Date(),
          };
        })
        .sort((a, b) => b.fechaObj - a.fechaObj);

      setClientes(listaClientes);
      setVehiculos(listaVehiculos);
      setVentas(listaVentas);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const eliminarVenta = async (id) => {
    try {
      await deleteDoc(doc(db, "ventas", id));
      toast.success("Venta eliminada");
      setVentas(ventas.filter((v) => v.id !== id));
      setConfirmarId(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar venta");
    }
  };

  // Filtro y paginación memoizados
  const ventasFiltradas = useMemo(() => {
    const filtro = filtroNombre.toLowerCase().trim();
    return ventas.filter((v) => {
      const textoCoincide = [
        v.clienteNombre.toLowerCase(),
        v.clienteApellido.toLowerCase(),
        v.dniCliente.toString().toLowerCase(),
        v.vehiculoInfo.toLowerCase(),
        v.patenteVehiculo.toLowerCase(),
      ].some((campo) => campo.includes(filtro));

      if (!textoCoincide) return false;
      if (fechaInicio && dayjs(v.fechaObj).isBefore(dayjs(fechaInicio), "day"))
        return false;
      if (fechaFin && dayjs(v.fechaObj).isAfter(dayjs(fechaFin), "day"))
        return false;
      return true;
    });
  }, [ventas, filtroNombre, fechaInicio, fechaFin]);

  const totalPaginas = Math.ceil(ventasFiltradas.length / ITEMS_POR_PAGINA);
  const ventasPagina = ventasFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  const irAPagina = (num) => {
    if (num < 1 || num > totalPaginas) return;
    setPaginaActual(num);
  };

  // Exportar PDF para venta específica
  const exportarPDF = useCallback((venta) => {
    if (!venta) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Detalle de Venta", 20, 20);
    doc.setFontSize(14);
    doc.text(
      `Cliente: ${venta.clienteNombre} ${venta.clienteApellido}`,
      20,
      40
    );
    doc.text(`Vehículo: ${venta.vehiculoInfo}`, 20, 50);
    doc.text(
      `Monto: $${Number(venta.monto).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      })}`,
      20,
      60
    );
    doc.text(
      `Fecha: ${dayjs(venta.fechaObj).locale("es").format("DD/MM/YYYY")}`,
      20,
      80
    );
    doc.save(`venta_${venta.id}.pdf`);
  }, []);

  const ventaDetalle = ventas.find((v) => v.id === detalleId);

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, DNI, vehículo, patente..."
          value={filtroNombre}
          onChange={(e) => {
            setFiltroNombre(e.target.value);
            setPaginaActual(1);
          }}
          className="p-2 rounded bg-slate-800 text-white"
          aria-label="Buscar ventas"
        />
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => {
            setFechaInicio(e.target.value);
            setPaginaActual(1);
          }}
          className="p-2 rounded bg-slate-800 text-white"
          aria-label="Fecha inicio"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => {
            setFechaFin(e.target.value);
            setPaginaActual(1);
          }}
          className="p-2 rounded bg-slate-800 text-white"
          aria-label="Fecha fin"
        />
      </div>

      {loading ? (
        <div
          className="text-center text-slate-400 py-10"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="animate-spin mx-auto" size={32} />
          Cargando ventas...
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <p className="text-center text-slate-400">
          No hay ventas que coincidan con el filtro.
        </p>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {ventasPagina.map((venta) => (
              <motion.div
                key={venta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-gradient-to-br from-slate-800 to-slate-700/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl border border-transparent hover:border-indigo-500 transition-all duration-300"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <p className="font-semibold text-xl text-indigo-300">
                      Cliente:{" "}
                      <span className="text-indigo-100">
                        {venta.clienteNombre} {venta.clienteApellido}
                      </span>
                    </p>

                    <p className="text-indigo-200 text-lg">
                      Vehículo:{" "}
                      <span className="font-medium text-indigo-50">
                        {venta.vehiculoInfo ||
                          `${venta.marca} ${venta.modelo} (${venta.patente})`}
                      </span>
                    </p>

                    {venta.monto && (
                      <p className="text-green-400 font-semibold text-lg">
                        Monto:{" "}
                        <span className="text-green-300 font-bold">
                          $
                          {Number(venta.monto).toLocaleString("es-AR", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    )}

                    <p className="text-indigo-300 text-sm font-mono">
                      Fecha:{" "}
                      {dayjs(venta.fechaObj).locale("es").format("DD/MM/YYYY")}
                    </p>

                    {venta.vehiculoPartePago && (
                      <p className="text-purple-400 font-semibold text-md mt-2">
                        🚗 Parte de Pago: {venta.vehiculoPartePago.marca}{" "}
                        {venta.vehiculoPartePago.modelo} - (
                        {venta.vehiculoPartePago.patente} -{" "}
                        {venta.vehiculoPartePago.año}) -{" "}
                        <span className="font-mono">
                          $
                          {Number(venta.vehiculoPartePago.monto).toLocaleString(
                            "es-AR",
                            { maximumFractionDigits: 2 }
                          )}
                        </span>
                      </p>
                    )}

                    {venta.pagos && venta.pagos.length > 0 && (
                      <p className="text-indigo-200 text-sm mt-3">
                        Método{venta.pagos.length > 1 ? "s" : ""} de pago:{" "}
                        <span className="text-indigo-100">
                          {venta.pagos.map((pago, i) => (
                            <span key={i}>
                              {pago.metodo || "N/A"}{" "}
                              {pago.monto
                                ? `($${Number(pago.monto).toLocaleString(
                                    "es-AR",
                                    {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 2,
                                    }
                                  )})`
                                : ""}
                              {i < venta.pagos.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-5 mt-2">
                    <button
                      onClick={() => setDetalleId(venta.id)}
                      title="Ver detalle"
                      className="text-yellow-400 hover:text-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
                      aria-label={`Ver detalle de la venta de ${venta.clienteNombre} ${venta.clienteApellido}`}
                    >
                      <Eye size={26} />
                    </button>

                    <button
                      onClick={() => exportarPDF(venta)}
                      title="Exportar PDF"
                      className="text-green-400 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 rounded"
                      aria-label={`Exportar PDF de la venta de ${venta.clienteNombre} ${venta.clienteApellido}`}
                    >
                      <Download size={26} />
                    </button>

                    <button
                      onClick={() => setConfirmarId(venta.id)}
                      title="Eliminar venta"
                      className="text-red-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                      aria-label={`Eliminar venta de ${venta.clienteNombre} ${venta.clienteApellido}`}
                    >
                      <Trash size={26} />
                    </button>
                  </div>
                </div>

                {/* Confirmar eliminación */}
                <AnimatePresence>
                  {confirmarId === venta.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 bg-red-900/40 p-3 rounded"
                    >
                      <p>¿Eliminar esta venta?</p>
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => eliminarVenta(venta.id)}
                          className="btn btn-sm bg-red-700 hover:bg-red-800 text-white"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setConfirmarId(null)}
                          className="btn btn-sm btn-outline"
                        >
                          Cancelar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Paginación */}
      <nav
        className="flex justify-center mt-6 space-x-2"
        role="navigation"
        aria-label="Paginación de ventas"
      >
        <button
          onClick={() => irAPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          aria-label="Página anterior"
          className="btn btn-sm"
        >
          &lt;
        </button>

        {[...Array(totalPaginas).keys()].map((i) => {
          const num = i + 1;
          return (
            <button
              key={num}
              onClick={() => irAPagina(num)}
              aria-current={paginaActual === num ? "page" : undefined}
              className={`btn btn-sm ${
                paginaActual === num ? "bg-blue-600 text-white" : "bg-slate-700"
              }`}
              aria-label={`Página ${num}`}
            >
              {num}
            </button>
          );
        })}

        <button
          onClick={() => irAPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          aria-label="Página siguiente"
          className="btn btn-sm"
        >
          &gt;
        </button>
      </nav>

      {/* Modal detalle */}
      <AnimatePresence>
        {detalleId && ventaDetalle && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="titulo-detalle"
            onKeyDown={(e) => e.key === "Escape" && setDetalleId(null)}
            tabIndex={-1}
          >
            <motion.div
              className="bg-slate-800 p-6 rounded-xl max-w-lg w-full text-white relative"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <button
                onClick={() => setDetalleId(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
                aria-label="Cerrar detalle"
              >
                ✕
              </button>

              <h2 id="titulo-detalle" className="text-xl font-bold mb-4">
                Detalle de Venta
              </h2>
              <p>
                <strong>Cliente:</strong> {ventaDetalle.clienteNombre}{" "}
                {ventaDetalle.clienteApellido}
              </p>
              <p>
                <strong>DNI:</strong> {ventaDetalle.dniCliente}
              </p>
              <p>
                <strong>Vehículo:</strong> {ventaDetalle.vehiculoInfo}
              </p>
              <p>
                <strong>Patente:</strong> {ventaDetalle.patenteVehiculo}
              </p>
              <p>
                <strong>Monto:</strong> $
                {Number(ventaDetalle.monto).toLocaleString("es-AR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {dayjs(ventaDetalle.fechaObj).locale("es").format("DD/MM/YYYY")}
              </p>

              {/* Puedes agregar más detalles según tus datos */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
