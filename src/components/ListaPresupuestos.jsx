import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
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

export default function ListaPresupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmarId, setConfirmarId] = useState(null);

  // Modal detalle
  const [detalleId, setDetalleId] = useState(null);

  // Modal nuevo presupuesto
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

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    try {
      const [snapPres, snapCli, snapVeh] = await Promise.all([
        getDocs(collection(db, "presupuestos")),
        getDocs(collection(db, "clientes")),
        getDocs(collection(db, "vehiculos")),
      ]);

      const listaPresupuestos = snapPres.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const listaClientes = snapCli.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const listaVehiculos = snapVeh.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setClientes(listaClientes);
      setVehiculos(listaVehiculos);

      const enriquecidos = listaPresupuestos.map((p) => {
  const cliente = listaClientes.find((c) => c.id === p.clienteId);
  const vehiculo = listaVehiculos.find((v) => v.id === p.vehiculoId);

  return {
    ...p,
    clienteNombre: cliente ? cliente.nombre : "Cliente no encontrado",
    clienteApellido: cliente?.apellido || "",
    dniCliente: cliente?.dni || "",
    vehiculoInfo: vehiculo
      ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
      : "Vehículo no encontrado",
    patenteVehiculo: vehiculo?.patente || "",
    fechaObj: p.fecha?.toDate ? p.fecha.toDate() : new Date(),
  };
});



      setPresupuestos(enriquecidos);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los datos");
    }
  };

  const eliminarPresupuesto = async (id) => {
    try {
      await deleteDoc(doc(db, "presupuestos", id));
      toast.success("Presupuesto eliminado");
      setPresupuestos(presupuestos.filter((p) => p.id !== id));
      setConfirmarId(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar presupuesto");
    }
  };

  const abrirDetalle = (id) => {
    setDetalleId(id);
  };

  const cerrarDetalle = () => {
    setDetalleId(null);
  };

  const presupuestoDetalle = presupuestos.find((p) => p.id === detalleId);

  const exportarPDF = () => {
    if (!presupuestoDetalle) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Detalle de Presupuesto", 20, 20);

    doc.setFontSize(14);
    doc.text(`Cliente: ${presupuestoDetalle.clienteNombre}`, 20, 40);
    doc.text(`Vehículo: ${presupuestoDetalle.vehiculoInfo}`, 20, 50);
    doc.text(
      `Monto estimado: $${Number(presupuestoDetalle.monto).toLocaleString("es-UY", { minimumFractionDigits: 2 })}`,
      20,
      60
    );
    doc.text(`Vigencia: ${presupuestoDetalle.vigencia} días`, 20, 70);
    doc.text(
      `Fecha: ${dayjs(presupuestoDetalle.fechaObj).locale("es").format("DD/MM/YYYY")}`,
      20,
      80
    );

    doc.save(`Presupuesto_${presupuestoDetalle.id}.pdf`);
  };

  const abrirModalNuevo = () => {
    setFormData({
      clienteId: clientes.length > 0 ? clientes[0].id : "",
      vehiculoId: vehiculos.length > 0 ? vehiculos[0].id : "",
      monto: "",
      vigencia: "",
      fecha: dayjs().toDate(),
    });
    setModalNuevo(true);
  };

  const cerrarModalNuevo = () => {
    setModalNuevo(false);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const manejarSubmitNuevo = async (e) => {
    e.preventDefault();

    if (!formData.clienteId || !formData.vehiculoId || !formData.monto || !formData.vigencia) {
      toast.error("Completa todos los campos");
      return;
    }

    try {
      const nuevaData = {
        clienteId: formData.clienteId,
        vehiculoId: formData.vehiculoId,
        monto: parseFloat(formData.monto),
        vigencia: parseInt(formData.vigencia),
        fecha: formData.fecha,
      };

      const docRef = await addDoc(collection(db, "presupuestos"), nuevaData);

      const cliente = clientes.find((c) => c.id === nuevaData.clienteId);
      const vehiculo = vehiculos.find((v) => v.id === nuevaData.vehiculoId);

      setPresupuestos((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...nuevaData,
          clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente no encontrado",
          dniCliente: cliente?.dni || "",
          vehiculoInfo: vehiculo
            ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
            : "Vehículo no encontrado",
          patenteVehiculo: vehiculo?.patente || "",
          fechaObj: nuevaData.fecha.toDate ? nuevaData.fecha.toDate() : nuevaData.fecha,
        },
      ]);

      toast.success("Presupuesto creado");
      cerrarModalNuevo();
    } catch (error) {
      console.error(error);
      toast.error("Error al crear presupuesto");
    }
  };

  // Filtrado con búsqueda por múltiples campos y filtro de fecha
  const presupuestosFiltrados = useMemo(() => {
    const textoFiltro = filtroNombre.toLowerCase().trim();

    return presupuestos.filter((p) => {
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
  }, [presupuestos, filtroNombre, fechaInicio, fechaFin]);

  // Paginación
  const totalPaginas = Math.ceil(presupuestosFiltrados.length / ITEMS_POR_PAGINA);
  const presupuestosPagina = presupuestosFiltrados.slice(
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
      <Toaster position="top-right" />

      <div className="flex items-center gap-2 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <FileText size={28} className="text-yellow-400" />
          <h2 className="text-2xl font-semibold">Presupuestos</h2>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-1 text-green-400 hover:text-green-600"
          title="Crear nuevo presupuesto"
        >
          <PlusCircle size={24} />
          Nuevo
        </button>
      </div>

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
          Cargando presupuestos...
        </div>
      ) : presupuestosFiltrados.length === 0 ? (
        <p className="text-center text-slate-400">No hay presupuestos que coincidan con el filtro.</p>
      ) : (
        <>
          <div className="grid gap-4">
            <AnimatePresence>
              {presupuestosPagina.map((p) => (
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
                        Cliente: <span className="text-blue-300">{p.clienteNombre}</span>
                      </p>
                      <p>
                        Vehículo: <span className="text-blue-300">{p.vehiculoInfo}</span>
                      </p>
                      {p.monto && (
                        <p>
                          Monto estimado:{" "}
                          <span className="text-green-400">
                            ${p.monto.toLocaleString("es-UY", { minimumFractionDigits: 2 })}
                          </span>
                        </p>
                      )}
                      {p.vigencia && (
                        <p>Vigencia: <span className="text-yellow-300">{p.vigencia} días</span></p>
                      )}
                      <p className="text-slate-400 text-sm">
                        Fecha: {dayjs(p.fechaObj).locale("es").format("DD/MM/YYYY")}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      {confirmarId === p.id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarPresupuesto(p.id);
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
                          title="Eliminar presupuesto"
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
                        title="Exportar PDF"
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
              <p className="mb-4">¿Seguro que quieres eliminar este presupuesto?</p>
              <div className="flex justify-around gap-4">
                <button
                  onClick={() => eliminarPresupuesto(confirmarId)}
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

      {/* Detalle presupuesto */}
      <AnimatePresence>
        {detalleId && presupuestoDetalle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          >
            <div className="bg-slate-900 p-6 rounded max-w-md w-full relative text-white">
              <button
                onClick={cerrarDetalle}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                title="Cerrar"
              >
                <XCircle size={24} />
              </button>
              <h3 className="text-2xl font-semibold mb-4">Detalle de Presupuesto</h3>
              <p>
                <strong>Cliente:</strong> {presupuestoDetalle.clienteNombre}
              </p>
              <p>
                <strong>DNI:</strong> {presupuestoDetalle.dniCliente}
              </p>
              <p>
                <strong>Vehículo:</strong> {presupuestoDetalle.vehiculoInfo}
              </p>
              <p>
                <strong>Monto estimado:</strong>{" "}
                ${Number(presupuestoDetalle.monto).toLocaleString("es-UY", { minimumFractionDigits: 2 })}
              </p>
              <p>
                <strong>Vigencia:</strong> {presupuestoDetalle.vigencia} días
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {dayjs(presupuestoDetalle.fechaObj).locale("es").format("DD/MM/YYYY")}
              </p>

              <button
                onClick={exportarPDF}
                className="mt-6 flex items-center gap-1 bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
                title="Exportar a PDF"
              >
                <Download size={18} />
                Exportar PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal nuevo presupuesto */}
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
              <h3 className="text-2xl font-semibold">Nuevo Presupuesto</h3>

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
