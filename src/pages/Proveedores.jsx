import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Pencil, Trash2, MessageCircle, LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmModal from "../components/proveedores/ConfirmModal";
import ProveedorModal from "../components/proveedores/ProveedorModal";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const snapshot = await getDocs(collection(db, "proveedores"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProveedores(data);
      } catch (err) {
        console.error("Error al obtener proveedores:", err);
        setError("Error al cargar los proveedores.");
      } finally {
        setLoading(false);
      }
    };

    fetchProveedores();
  }, []);

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value.toLowerCase());
  };

  const eliminarProveedor = async () => {
    if (proveedorAEliminar) {
      await deleteDoc(doc(db, "proveedores", proveedorAEliminar.id));
      setProveedores((prev) => prev.filter((p) => p.id !== proveedorAEliminar.id));
      setConfirmModal(false);
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) =>
    `${p.nombre} ${p.tipo}`.toLowerCase().includes(busqueda)
  );

  return (
    <div className="p-6 text-white max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Proveedores</h1>

      {/* Filtro y botón */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar proveedores..."
          value={busqueda}
          onChange={handleBusqueda}
          className="bg-slate-800 p-2 rounded-md w-full max-w-sm"
        />
        <button
          onClick={() => {
            setProveedorSeleccionado(null);
            setModalAbierto(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
          aria-label="Agregar proveedor"
        >
          Agregar Proveedor
        </button>
      </div>

      {/* Estado de carga o error */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">
        <LoaderCircle className="animate-spin mx-auto" size={32} />
        Cargando proveedores...
        </div>
      ) : error ? (
        <p className="text-center text-red-400">{error}</p>
      ) : proveedoresFiltrados.length === 0 ? (
        <p className="text-center text-slate-400">
          No hay proveedores que coincidan.
        </p>
      ) : (
        <div className="space-y-3">
          {proveedoresFiltrados.map((proveedor) => {
            const numeroWhatsApp = proveedor.telefono?.replace(/\D/g, "");

            return (
              <motion.div
                key={proveedor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-700 p-4 rounded-xl shadow-md flex justify-between items-center"
              >
                <div>
                  <p className="text-lg text-blue-400 font-semibold">
                    {proveedor.nombre}
                  </p>
                  <p className="p-2 text-xl text-slate-300">
                    · Tipo: {proveedor.tipo || "General"}
                  </p>
                  <p className="text-sm text-slate-300">
                    {proveedor.email || "Sin email"} ·{" "}
                    <a
                      href={`tel:${proveedor.telefono}`}
                      className="text-blue-400 hover:underline"
                    >
                      {proveedor.telefono}
                    </a>{" "}
                    · Dirección: {proveedor.direccion || "-"}
                  </p>
                  <p className="text-l text-green-400 mt-1">
                    Creado por: {proveedor.creadoPor || "Desconocido"} ·{" "}
                    {proveedor.creadoEn
                      ? new Date(
                          proveedor.creadoEn.seconds * 1000
                        ).toLocaleString()
                      : "-"}
                  </p>
                  <p className="text-l text-yellow-400 mt-1">
                    Modificado por: {proveedor.modificadoPor || "Desconocido"} ·{" "}
                    {proveedor.modificadoEn
                      ? new Date(
                          proveedor.modificadoEn.seconds * 1000
                        ).toLocaleString()
                      : "-"}
                  </p>
                  {proveedor.observaciones && (
                    <p className="text-s text-slate-400 mt-1">
                      📝 {proveedor.observaciones}
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
                      setProveedorSeleccionado(proveedor);
                      setModalAbierto(true);
                    }}
                    className="text-indigo-300 hover:text-indigo-500"
                    aria-label="Editar proveedor"
                  >
                    <Pencil />
                  </button>

                  <button
                    onClick={() => {
                      setProveedorAEliminar(proveedor);
                      setConfirmModal(true);
                    }}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Eliminar proveedor"
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
        <ProveedorModal
          abierto={modalAbierto}
          cerrar={() => setModalAbierto(false)}
          proveedorActual={proveedorSeleccionado}
          onSave={(nuevoProveedor) => {
            if (proveedorSeleccionado) {
              setProveedores((prev) =>
                prev.map((p) =>
                  p.id === nuevoProveedor.id ? nuevoProveedor : p
                )
              );
            } else {
              setProveedores((prev) => [...prev, nuevoProveedor]);
            }
          }}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          abierto={confirmModal}
          title="Eliminar Proveedor"
          message={`¿Estás seguro de que quieres eliminar al proveedor ${proveedorAEliminar?.nombre}?`}
          onConfirm={eliminarProveedor}
          onCancel={() => setConfirmModal(false)}
        />
      )}
    </div>
  );
}
