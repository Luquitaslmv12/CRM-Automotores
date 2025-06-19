import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Pencil, Trash2, MessageCircle, LoaderCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmModal from "../components/proveedores/ConfirmModal";
import ProveedorModal from "../components/proveedores/ProveedorModal";
import ModalReparacion from "../components/reparaciones/ModalReparacion";

export default function Reparaciones() {
  const [reparaciones, setReparaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [reparacionSeleccionado, setReparacionSeleccionado] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reparacionAEliminar, setReparacionAEliminar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
const [talleres, setTalleres] = useState([]);
 const [toast, setToast] = useState(null);

 const clienteNombre = clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}` : '';


const obtenerVehiculo = (id) => vehiculos.find((v) => v.id === id);
const obtenerTaller = (id) => talleres.find((t) => t.id === id);


  const mostrarToast = (mensaje, tipo = "ok") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };



useEffect(() => {
  const fetchData = async () => {
    try {
      const [reparacionSnap, vehiculoSnap, tallerSnap] = await Promise.all([
        getDocs(collection(db, "reparaciones")),
        getDocs(collection(db, "vehiculos")),
        getDocs(collection(db, "proveedores")),
      ]);

      const reparacionesData = reparacionSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const vehiculosData = vehiculoSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const talleresData = tallerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setReparaciones(reparacionesData);
      setVehiculos(vehiculosData);
      setTalleres(talleresData);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  const handleBusqueda = (e) => {
    setBusqueda(e.target.value.toLowerCase());
  };

  const eliminarReparacion = async () => {
    if (reparacionAEliminar) {
      await deleteDoc(doc(db, "reparaciones", reparacionAEliminar.id));
      setReparaciones((prev) => prev.filter((p) => p.id !== reparacionAEliminar.id));
      setConfirmModal(false);
    }
  };

  const reparacionesFiltrados = reparaciones.filter((p) =>
    `${p.nombre} ${p.tipo}`.toLowerCase().includes(busqueda)
  );

  return (


    <div className="p-6 text-white max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reparaciones</h1>
      
          {/* Toast notificación */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
              toast.tipo === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.mensaje}
          </motion.div>
        )}
      </AnimatePresence>



      {/* Filtro y botón */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar reparaciones..."
          value={busqueda}
          onChange={handleBusqueda}
          className="bg-slate-800 p-2 rounded-md w-full max-w-sm"
        />
        <button
          onClick={() => {
            setReparacionSeleccionado(null);
            setModalAbierto(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
          aria-label="Agregar reparacion"
        >
          Agregar reparacion
        </button>
      </div>

      {/* Estado de carga o error */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">
        <LoaderCircle className="animate-spin mx-auto" size={32} />
        Cargando reparaciones...
        </div>
      ) : error ? (
        <p className="text-center text-red-400">{error}</p>
      ) : reparacionesFiltrados.length === 0 ? (
        <p className="text-center text-slate-400">
          No hay reparaciones que coincidan.
        </p>
      ) : (
        <div className="space-y-3">
          {reparacionesFiltrados.map((reparacion) => {
            const numeroWhatsApp = reparacion.telefono?.replace(/\D/g, "");
             const vehiculo = obtenerVehiculo(reparacion.vehiculoId);
             const taller = obtenerTaller(reparacion.tallerId);

            return (
                
              <motion.div
                key={reparacion.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-700 p-4 rounded-xl shadow-md flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-lg">{reparacion.descripcionReparacion}</div>
      <div className="text-sm text-slate-300">
        Vehículo: {vehiculo?.patente || "Desconocido"} ({vehiculo?.modelo})
      </div>
      <div className="text-sm text-slate-300">
        Taller: {taller?.nombre || "Desconocido"}
      </div>
      <div className="text-sm text-slate-400">
        Precio: ${reparacion.precioServicio}
      </div>
                  <p className="text-l text-green-400 mt-1">
                    Creado por: {reparacion.creadoPor || "Desconocido"} ·{" "}
                    {reparacion.creadoEn
                      ? new Date(
                          reparacion.creadoEn.seconds * 1000
                        ).toLocaleString()
                      : "-"}
                  </p>
                  <p className="text-l text-yellow-400 mt-1">
                    Modificado por: {reparacion.modificadoPor || "Desconocido"} ·{" "}
                    {reparacion.modificadoEn
                      ? new Date(
                          reparacion.modificadoEn.seconds * 1000
                        ).toLocaleString()
                      : "-"}
                  </p>
                  {reparacion.observaciones && (
                    <p className="text-s text-slate-400 mt-1">
                      📝 {reparacion.observaciones}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  {numeroWhatsApp && (
                    <a
                      href={`https://wa.me/${numeroWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-600"
                      aria-label="Enviar WhatsApp"
                    >
                      <MessageCircle />
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setReparacionSeleccionado(reparacion);
                      setModalAbierto(true);
                    }}
                    className="text-indigo-300 hover:text-indigo-500"
                    aria-label="Editar reparacion"
                  >
                    <Pencil />
                  </button>

                  <button
                    onClick={() => {
                      setReparacionAEliminar(reparacion);
                      setConfirmModal(true);
                    }}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Eliminar reparacion"
                  >
                    <Trash2 />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      {modalAbierto && (
       /*  <ModalReparacion
          abierto={modalAbierto}
          cerrar={() => setModalAbierto(false)}
          reparacionActual={reparacionSeleccionado}
          onSave={(nuevoReparacion) => {
            if (reparacionSeleccionado) {
              setReparaciones((prev) =>
                prev.map((p) =>
                  p.id === nuevoReparacion.id ? nuevoReparacion : p
                )
              );
            } else {
              setReparaciones((prev) => [...prev, nuevoReparacion]);
            }
          }}
        /> */

       <ModalReparacion
  visible={modalAbierto}
  vehiculo={
    reparacionSeleccionado
      ? obtenerVehiculo(reparacionSeleccionado.vehiculoId)
      : null
  }
  reparacion={reparacionSeleccionado}
  onClose={() => {
    setModalAbierto(false);
    setReparacionSeleccionado(null);
  }}
  onSuccess={async () => {
    mostrarToast(
      reparacionSeleccionado
        ? "Reparación actualizada correctamente"
        : "Reparación creada correctamente"
    );
    // Refrescar datos desde Firestore para reflejar cambios
    const snapshot = await getDocs(collection(db, "reparaciones"));
    const actualizadas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setReparaciones(actualizadas);
    setReparacionSeleccionado(null);
    setModalAbierto(false);
  }}
/>
      )}


      

      {confirmModal && (
        <ConfirmModal
          abierto={confirmModal}
          title="Eliminar reparacion"
          message={`¿Estás seguro de que quieres eliminar al reparacion ${reparacionAEliminar?.nombre}?`}
          onConfirm={eliminarReparacion}
          onCancel={() => setConfirmModal(false)}
        />
      )}
    </div>
  );
}
