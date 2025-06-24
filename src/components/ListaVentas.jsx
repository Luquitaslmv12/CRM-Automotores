import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Trash,
  XCircle,
  Download,
  LoaderCircle,
  Eye,
  User,
  Car,
  DollarSign,
  Calendar,
  Trash2,
  KeyRound,
  CreditCard,
  UserCircle,
  ShoppingCart,
  FilePlus,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { jsPDF } from "jspdf";
import exportarBoletoDOCX from "./boletos/exportarBoletoDOCX";
import TooltipWrapper from "./Tooltip/TooltipWrapper";

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
            clienteDireccion: cliente?.direccion || "",
            localidadCliente: cliente?.localidad || "",
            telefonoCliente: cliente?.telefono || "",
            emailCliente: cliente?.email || "",
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
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-gradient-to-br from-slate-800 to-slate-700/70 backdrop-blur-sm border border-slate-600 p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start gap-6">
                  {/* Datos */}
                  <div className="flex-1 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2 text-slate-300 text-lg">
                      <User className="w-6 h-6" />
                      <span className="font-semibold">
                        {venta.clienteNombre} {venta.clienteApellido}
                      </span>

                      <div className="flex items-center gap-2 text-cyan-300">
                        <Car className="w-6 h-6" />
                        <span>
                          {venta.vehiculoInfo ||
                            `${venta.marca} ${venta.modelo}`}{" "}
                          · <span className="text-white">{venta.patente}</span>
                        </span>
                      </div>
                    </div>

                    {venta.monto && (
                      <div className="flex items-center gap-2  ">
                        <DollarSign className="w-4 h-4 text-lime-400" />
                        <span className="font-semibol text-lime-400">
                          {Number(venta.monto).toLocaleString("es-AR", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-pink-300">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {dayjs(venta.fechaObj)
                          .locale("es")
                          .format("DD/MM/YYYY")}
                      </span>
                    </div>

                    {venta.vehiculoPartePago && (
                      <div className="text-purple-400 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <KeyRound className="w-4 h-4" />
                          Parte de Pago: {venta.vehiculoPartePago.marca}{" "}
                          {venta.vehiculoPartePago.modelo} (
                          {venta.vehiculoPartePago.patente} -{" "}
                          {venta.vehiculoPartePago.año}) ·{" "}
                          <span className="text-purple-300 font-mono">
                            $
                            {Number(
                              venta.vehiculoPartePago.monto
                            ).toLocaleString("es-AR", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </span>
                      </div>
                    )}

                    {venta.pagos?.length > 0 && (
                      <div className="text-indigo-200 text-sm">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4 text-indigo-400" />
                          Método{venta.pagos.length > 1 ? "s" : ""} de pago:{" "}
                          {venta.pagos.map((pago, i) => (
                            <span key={i}>
                              {pago.metodo || "N/A"}{" "}
                              {pago.monto
                                ? `($${Number(pago.monto).toLocaleString(
                                    "es-AR",
                                    {
                                      maximumFractionDigits: 2,
                                    }
                                  )})`
                                : ""}
                              {i < venta.pagos.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex flex-col items-center gap-4 mt-2 text-white">
                    <TooltipWrapper label="Ver detalle">
                      <button
                        onClick={() => setDetalleId(venta.id)}
                        className="text-yellow-400 hover:text-yellow-600"
                      >
                        <Eye size={22} />
                      </button>
                    </TooltipWrapper>

                    <TooltipWrapper label="Exportar BOLETO">
                      <button
                        onClick={() => exportarBoletoDOCX(venta)}
                        className="text-green-400 hover:text-green-600"
                      >
                        <Download size={22} />
                      </button>
                    </TooltipWrapper>

                    <TooltipWrapper label="Eliminar venta">
                      <button
                        onClick={() => setConfirmarId(venta.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={22} />
                      </button>
                    </TooltipWrapper>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-600">
                  <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                    Datos de La Compra/Venta
                  </h4>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <UserCircle className="text-blue-500" size={16} />
                      <span>
                        <strong className="text-blue-500">Tomado por:</strong>{" "}
                        {venta.vehiculoPartePago?.recibidoPor || "—"} ·{" "}
                        {venta.creadoEn
                          ? new Date(
                              venta.creadoEn.seconds * 1000
                            ).toLocaleString()
                          : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShoppingCart className="text-green-500" size={16} />
                      <span>
                        <strong className="text-green-500">Vendido por:</strong>{" "}
                        {venta.vendidoPor || "—"} ·{" "}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FilePlus className="text-indigo-500" size={16} />
                      <span>
                        <strong className="text-indigo-500">Creado por:</strong>{" "}
                        {venta.creadoPor || "—"} ·{" "}
                        {venta.creadoEn
                          ? new Date(
                              venta.creadoEn.seconds * 1000
                            ).toLocaleString()
                          : "—"}
                      </span>
                    </div>

                    {venta.modificadoPor && (
                      <div className="flex items-center gap-2">
                        <Hammer className="text-yellow-500" size={16} />
                        <span>
                          <strong className="text-yellow-500">
                            Modificado por:
                          </strong>{" "}
                          {venta.modificadoPor} ·{" "}
                          {venta.modificadoEn
                            ? new Date(
                                venta.modificadoEn.seconds * 1000
                              ).toLocaleString()
                            : "—"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
