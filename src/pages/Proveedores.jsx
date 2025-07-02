import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmModal from "../components/proveedores/ConfirmModal";
import ProveedorModal from "../components/proveedores/ProveedorModal";
import ProveedorList from "../components/proveedores/ProveedorCard";

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
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
      setProveedores((prev) =>
        prev.filter((p) => p.id !== proveedorAEliminar.id)
      );
      setConfirmModal(false);
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) =>
    `${p.nombre} ${p.tipo}`.toLowerCase().includes(busqueda)
  );

  return (
    <div className="p-6 text-white max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Proveedores</h1>

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
        >
          Agregar Proveedor
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <LoaderCircle className="mx-auto" size={32} />
          </motion.div>
          Cargando proveedores...
        </div>
      ) : error ? (
        <p className="text-center text-red-400">{error}</p>
      ) : proveedoresFiltrados.length === 0 ? (
        <p className="text-center text-slate-400">
          No hay proveedores que coincidan.
        </p>
      ) : (
        <ProveedorList
          proveedores={proveedoresFiltrados}
          onEditar={(prov) => {
            setProveedorSeleccionado(prov);
            setModalAbierto(true);
          }}
          onEliminar={(prov) => {
            setProveedorAEliminar(prov);
            setConfirmModal(true);
          }}
        />
      )}

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
