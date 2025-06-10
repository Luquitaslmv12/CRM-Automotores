import { useEffect, useState } from "react";
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
  FileDown,
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
          clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente no encontrado",
          vehiculoInfo: vehiculo
            ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
            : "Vehículo no encontrado",
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
          vehiculoInfo: vehiculo
            ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
            : "Vehículo no encontrado",
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

      {loading ? (
        <div className="text-center text-slate-400 py-10">
          <LoaderCircle className="animate-spin mx-auto" size={32} />
          Cargando presupuestos...
        </div>
      ) : presupuestos.length === 0 ? (
        <p className="text-center text-slate-400">No hay presupuestos guardados.</p>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {presupuestos.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-800 rounded-xl p-4 shadow-md cursor-pointer"
                onClick={() => abrirDetalle(p.id)}
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
                          className="text-red-500 hover:text-red-700"
                          title="Confirmar eliminar"
                        >
                          <Trash size={24} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmarId(null);
                          }}
                          className="text-gray-400 hover:text-gray-600"
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
                        className="text-red-400 hover:text-red-600"
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
                      className="text-green-400 hover:text-green-600"
                      title="Exportar PDF"
                    >
                      <Download size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Detalle */}
      <AnimatePresence>
        {detalleId && presupuestoDetalle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={cerrarDetalle}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-lg p-6 max-w-lg w-full text-white shadow-lg relative"
            >
              <h3 className="text-xl font-semibold mb-4">Detalle del Presupuesto</h3>

              <p>
                <strong>Cliente:</strong> {presupuestoDetalle.clienteNombre}
              </p>
              <p>
                <strong>Vehículo:</strong> {presupuestoDetalle.vehiculoInfo}
              </p>
              <p>
                <strong>Monto estimado:</strong>{" "}
                ${presupuestoDetalle.monto.toLocaleString("es-UY", { minimumFractionDigits: 2 })}
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
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md"
              >
                <Download size={20} />
                Exportar PDF
              </button>

              <button
                onClick={cerrarDetalle}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
                title="Cerrar"
              >
                <XCircle size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nuevo Presupuesto */}
      <AnimatePresence>
        {modalNuevo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={cerrarModalNuevo}
          >
            <motion.form
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-lg p-6 max-w-md w-full text-white shadow-lg"
              onSubmit={manejarSubmitNuevo}
            >
              <h3 className="text-xl font-semibold mb-4">Crear nuevo presupuesto</h3>

              <label className="block mb-3">
                <span>Cliente</span>
                <select
                  name="clienteId"
                  value={formData.clienteId}
                  onChange={manejarCambio}
                  className="w-full mt-1 p-2 rounded bg-slate-800"
                  required
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block mb-3">
                <span>Vehículo</span>
                <select
                  name="vehiculoId"
                  value={formData.vehiculoId}
                  onChange={manejarCambio}
                  className="w-full mt-1 p-2 rounded bg-slate-800"
                  required
                >
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} ({v.patente})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block mb-3">
                <span>Monto estimado</span>
                <input
                  type="number"
                  step="0.01"
                  name="monto"
                  value={formData.monto}
                  onChange={manejarCambio}
                  className="w-full mt-1 p-2 rounded bg-slate-800"
                  placeholder="Ej: 15000.50"
                  required
                />
              </label>

              <label className="block mb-3">
                <span>Vigencia (días)</span>
                <input
                  type="number"
                  name="vigencia"
                  value={formData.vigencia}
                  onChange={manejarCambio}
                  className="w-full mt-1 p-2 rounded bg-slate-800"
                  placeholder="Ej: 30"
                  required
                />
              </label>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalNuevo}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
                >
                  Crear
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
