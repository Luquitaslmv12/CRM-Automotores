import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
    query,
    orderBy,
    limit,
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import {
  Trash,
  FileText,
  LoaderCircle,
  PlusCircle,
  XCircle,
  Download,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { jsPDF } from "jspdf";
import exportarBoletoDOCX from "./boletos/exportarBoletoDOCX";



export default function Listaventas() {
  const [ventas, setventas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmarId, setConfirmarId] = useState(null);

  // Modal detalle
  const [detalleId, setDetalleId] = useState(null);

  // Modal nuevo venta
  const [modalNuevo, setModalNuevo] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: "",
    vehiculoId: "",
    monto: "",
    vigencia: "",
    fecha: dayjs().toDate(),
  });

  // Filtros y paginación
  const [filtroNombre, setFiltroNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 5;

  const [modalBoleto, setModalBoleto] = useState(null);


  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    try {
      const [snapPres, snapCli, snapVeh] = await Promise.all([
        getDocs(collection(db, "ventas")),
        getDocs(collection(db, "clientes")),
        getDocs(collection(db, "vehiculos")),
      ]);

      const listaVentas = snapPres.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const listaClientes = snapCli.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const listaVehiculos = snapVeh.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setClientes(listaClientes);
      setVehiculos(listaVehiculos);

      const enriquecidos = listaVentas.map((p) => {
  const cliente = listaClientes.find((c) => c.id === p.clienteId);
  const vehiculo = listaVehiculos.find((v) => v.id === p.vehiculoId);
  return {
    ...p,
    clienteNombre: cliente ? cliente.nombre : "Cliente no encontrado",
    clienteApellido: cliente ? cliente.apellido : "",
    dniCliente: cliente?.dni || "",
    vehiculoInfo: vehiculo
      ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
      : "Vehículo no encontrado",
    patenteVehiculo: vehiculo?.patente || "",
    fechaObj: p.fecha?.toDate ? p.fecha.toDate() : new Date(),
  };
})
.sort((a, b) => b.fechaObj - a.fechaObj);

      setventas(enriquecidos);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los datos");
    }
  };

  const eliminarventa = async (id) => {
    try {
      await deleteDoc(doc(db, "ventas", id));
      toast.success("Venta eliminada");
      setventas(ventas.filter((p) => p.id !== id));
      setConfirmarId(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar venta");
    }
  };

  const abrirDetalle = (id) => {
    setDetalleId(id);
  };

  const cerrarDetalle = () => {
    setDetalleId(null);
  };

  const ventaDetalle = ventas.find((p) => p.id === detalleId);

  const exportarPDF = () => {
    if (!ventaDetalle) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Detalle de Venta", 20, 20);

    doc.setFontSize(14);
    doc.text(`Cliente: ${ventaDetalle.clienteNombre}`, 20, 40);
    doc.text(`Vehículo: ${ventaDetalle.vehiculoInfo}`, 20, 50);
    doc.text(
      `Monto: $${Number(ventaDetalle.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
      20,
      60
    );
    doc.text(
      `Fecha: ${dayjs(ventaDetalle.fechaObj).locale("es").format("DD/MM/YYYY")}`,
      20,
      80
    );

    doc.save(`venta_${ventaDetalle.id}.pdf`);
  };




  // Filtrado con búsqueda por múltiples campos y filtro de fecha
  const ventasFiltrados = useMemo(() => {
    const textoFiltro = filtroNombre.toLowerCase().trim();

    return ventas.filter((p) => {
      // Buscar por cliente
      const nombreCompleto = p.clienteNombre.toLowerCase();
      const dni = p.dniCliente.toString().toLowerCase();
      // Vehículo separado para buscar patente, marca y modelo
      const vehiculo = p.vehiculoInfo.toLowerCase();
      const patente = p.patenteVehiculo.toLowerCase();

    const textoCoincide =
  (p.clienteNombre?.toLowerCase() || "").includes(textoFiltro) ||
  (p.clienteApellido?.toLowerCase() || "").includes(textoFiltro) ||
  (p.dniCliente?.toString().toLowerCase() || "").includes(textoFiltro) ||
  (p.vehiculoInfo?.toLowerCase() || "").includes(textoFiltro) ||
  (p.patenteVehiculo?.toLowerCase() || "").includes(textoFiltro);

      if (!textoCoincide) return false;

      // Filtrar por fechas
      if (fechaInicio) {
        if (dayjs(p.fechaObj).isBefore(dayjs(fechaInicio), "day")) {
          return false;
        }
      }
      if (fechaFin) {
        if (dayjs(p.fechaObj).isAfter(dayjs(fechaFin), "day")) {
          return false;
        }
      }

      return true;
    });
  }, [ventas, filtroNombre, fechaInicio, fechaFin]);

  // Paginación
  const totalPaginas = Math.ceil(ventasFiltrados.length / ITEMS_POR_PAGINA);
  const ventasPagina = ventasFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  // Cambiar página
  const irAPagina = (num) => {
    if (num < 1 || num > totalPaginas) return;
    setPaginaActual(num);
  };

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
            setPaginaActual(1); // reiniciar página al buscar
          }}
          className="p-2 rounded bg-slate-800 text-white"
        />
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => {
            setFechaInicio(e.target.value);
            setPaginaActual(1);
          }}
          className="p-2 rounded bg-slate-800 text-white"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => {
            setFechaFin(e.target.value);
            setPaginaActual(1);
          }}
          className="p-2 rounded bg-slate-800 text-white"
        />
      </div>

        {loading ? (
        <div className="text-center text-slate-400 py-10">
          <LoaderCircle className="animate-spin mx-auto" size={32} />
          Cargando ventas...
        </div>
      ) : ventasFiltrados.length === 0 ? (
        <p className="text-center text-slate-400">No hay ventas que coincidan con el filtro.</p>
      ) : (
        <>
          <div className="grid gap-4">
            <AnimatePresence>
              {ventasPagina.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-800 rounded-xl p-4 shadow-md "
                  
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        Cliente: <span className="text-blue-300">{p.clienteNombre} {p.clienteApellido}</span>
                      </p>
                      <p>
                        Vehículo: <span className="text-blue-300">{p.vehiculoInfo}</span>
                      </p>
                      {p.monto && (
                        <p>
                          Monto:{" "}
                          <span className="text-green-400">
                            ${p.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </span>
                        </p>
                      )}
                      <p className="text-slate-400 ">
                        Fecha: {dayjs(p.fechaObj).locale("es").format("DD/MM/YYYY")}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      {confirmarId === p.id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarventa(p.id);
                            }}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                            title="Confirmar eliminar"
                          >
                            <Trash size={24} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmarId(null);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Cancelar"
                          >
                            <XCircle size={24} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmarId(p.id);
                          }}
                          className="text-red-400 hover:text-red-600 cursor-pointer"
                          title="Eliminar venta"
                        >
                          <Trash size={24} />
                        </button>
                        
                      )}
                  

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportarPDF();
                        }}
                        className="text-green-400 hover:text-green-600 cursor-pointer"
                        title="Descargar"
                      >
                        <Download size={24} onClick={() => abrirDetalle(p.id)} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Paginación */}
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => irAPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50"
            >
              Anterior
            </button>
            {[...Array(totalPaginas)].map((_, i) => (
              <button
                key={i}
                onClick={() => irAPagina(i + 1)}
                className={`px-3 py-1 rounded ${
                  paginaActual === i + 1 ? "bg-yellow-400 text-black" : "bg-slate-800"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => irAPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* Confirmar eliminar */}
      <AnimatePresence>
        {confirmarId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          >
            <div className="bg-slate-900 p-6 rounded max-w-sm w-full text-center">
              <p className="mb-4">¿Seguro que quieres eliminar este venta?</p>
              <div className="flex justify-around gap-4">
                <button
                  onClick={() => eliminarventa(confirmarId)}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmarId(null)}
                  className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detalle venta */}
     <AnimatePresence>
  {detalleId && ventaDetalle && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
    >
      <div className="bg-slate-900 p-6 rounded max-w-md w-full relative text-white">
        <button
          onClick={cerrarDetalle}
          className="absolute top-2 right-2 text-red-400 hover:text-red-600"
          title="Cerrar"
        >
          <XCircle size={24} />
        </button>

        <h3 className="text-2xl font-semibold mb-4">Detalle de venta</h3>
        <p>
          <strong>Cliente:</strong> {ventaDetalle.clienteNombre}
        </p>
        <p>
          <strong>DNI:</strong> {ventaDetalle.dniCliente}
        </p>
        <p>
          <strong>Vehículo:</strong> {ventaDetalle.vehiculoInfo}
        </p>
        <p>
          <strong>Monto:</strong>{" "}
          ${Number(ventaDetalle.monto).toLocaleString("es-UY", { minimumFractionDigits: 2 })}
        </p>
        <p>
          <strong>Fecha:</strong>{" "}
          {dayjs(ventaDetalle.fechaObj).locale("es").format("DD/MM/YYYY")}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
      

          <button
            onClick={() =>{
               exportarBoletoDOCX(ventaDetalle);
               cerrarDetalle();
            }}
            className="flex items-center gap-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            title="Descargar BOLETO"
            
          >
            <Download size={18} />
            Descargar BOLETO
          </button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>


      {/* Modal nuevo venta */}
      <AnimatePresence>
        {modalNuevo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          >
            <motion.form
              onSubmit={manejarSubmitNuevo}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-slate-900 p-6 rounded max-w-md w-full space-y-4 text-white"
            >
              <h3 className="text-2xl font-semibold">Nuevo venta</h3>

              <label>
                Cliente:
                <select
                  name="clienteId"
                  value={formData.clienteId}
                  onChange={manejarCambio}
                  className="w-full mt-1 p-2 bg-slate-800 rounded"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido} (DNI: {c.dni})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Vehículo:
                <select
                  name="vehiculoId"
                  value={formData.vehiculoId}
                  onChange={manejarCambio}
                  className="w-full mt-1 p-2 bg-slate-800 rounded"
                >
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} (Patente: {v.patente})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Monto estimado:
                <input
                  type="number"
                  name="monto"
                  min="0"
                  step="0.01"
                  value={formData.monto}
                  onChange={manejarCambio}
                  className="w-full mt-1 p-2 bg-slate-800 rounded"
                  required
                />
              </label>

              <label>
                Vigencia (días):
                <input
                  type="number"
                  name="vigencia"
                  min="1"
                  value={formData.vigencia}
                  onChange={manejarCambio}
                  className="w-full mt-1 p-2 bg-slate-800 rounded"
                  required
                />
              </label>

              <label>
                Fecha:
                <input
                  type="date"
                  name="fecha"
                  value={dayjs(formData.fecha).format("YYYY-MM-DD")}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      fecha: new Date(e.target.value),
                    }))
                  }
                  className="w-full mt-1 p-2 bg-slate-800 rounded"
                  required
                />
              </label>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={cerrarModalNuevo}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
                >
                  Guardar
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
