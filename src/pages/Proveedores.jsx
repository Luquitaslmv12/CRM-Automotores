import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Pencil, Trash2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmModal from "../components/proveedores/ConfirmModal";
import ProveedorModal from "../components/proveedores/ProveedorModal"; // Modal para agregar/editar proveedores

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  useEffect(() => {
    const fetchProveedores = async () => {
      const snapshot = await getDocs(collection(db, "proveedores"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProveedores(data);
      setProveedoresFiltrados(data);
    };

    fetchProveedores();
  }, []);

  const handleBusqueda = (e) => {
    const valor = e.target.value.toLowerCase();
    setBusqueda(valor);
    setProveedoresFiltrados(
      proveedores.filter((p) =>
        `${p.nombre} ${p.tipo}`.toLowerCase().includes(valor)
      )
    );
  };

  const eliminarProveedor = async () => {
    if (proveedorAEliminar) {
      await deleteDoc(doc(db, "proveedores", proveedorAEliminar.id));
      setProveedores((prev) =>
        prev.filter((p) => p.id !== proveedorAEliminar.id)
      );
      setProveedoresFiltrados((prev) =>
        prev.filter((p) => p.id !== proveedorAEliminar.id)
      );
      setConfirmModal(false);
    }
  };

  return (
    <div className="p-6 text-white max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Proveedores</h1>

      {/* Filtro y botón */}
      <div className="flex justify-between items-center mb-4">
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
        >
          Agregar Proveedor
        </button>
      </div>

      {/* Listado de proveedores */}
      <div className="space-y-3">
        {proveedoresFiltrados.length === 0 ? (
          <p className="text-center text-slate-400">
            No hay proveedores que coincidan.
          </p>
        ) : (
          proveedoresFiltrados.map((proveedor) => (
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
                    : "-"}{" "}
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
                <a
                  href={`https://wa.me/${proveedor.telefono}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-600"
                  aria-label="Enviar WhatsApp"
                >
                  <MessageCircle />
                </a>

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
          ))
        )}
      </div>

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
              setProveedoresFiltrados((prev) =>
                prev.map((p) =>
                  p.id === nuevoProveedor.id ? nuevoProveedor : p
                )
              );
            } else {
              setProveedores((prev) => [...prev, nuevoProveedor]);
              setProveedoresFiltrados((prev) => [...prev, nuevoProveedor]);
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
