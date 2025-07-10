import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { LoaderCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmModal from "../components/proveedores/ConfirmModal";
import ProveedorModal from "../components/proveedores/ProveedorModal";
import ProveedorList from "../components/proveedores/ProveedorCard";
import EstadoCuentaModal from "../components/proveedores/EstadoCuentaModal";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reparacionesTaller, setReparacionesTaller] = useState([]);
  const [estadoCuentaModalAbierto, setEstadoCuentaModalAbierto] = useState(false);

  // ✅ Función reutilizable para obtener reparaciones por proveedor
  const obtenerReparacionesPorTaller = async (tallerId) => {
    const q = query(collection(db, "reparaciones"), where("tallerId", "==", tallerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  // ✅ Cargar proveedores y agregar campo `tieneDeuda`
  useEffect(() => {
    const fetchProveedoresConDeuda = async () => {
      try {
        const snapshot = await getDocs(collection(db, "proveedores"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Para cada proveedor, consultar sus reparaciones y calcular si tiene deuda
        const dataConDeuda = await Promise.all(
          data.map(async (p) => {
            const reparaciones = await obtenerReparacionesPorTaller(p.id);
            const tieneDeuda = reparaciones.some((r) => r.saldo > 0); // Ajusta campo si es distinto
            return { ...p, tieneDeuda };
          })
        );

        setProveedores(dataConDeuda);
      } catch (err) {
        console.error("Error al obtener proveedores o reparaciones:", err);
        setError("Error al cargar los proveedores.");
      } finally {
        setLoading(false);
      }
    };

    fetchProveedoresConDeuda();
  }, []);

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value.toLowerCase());
  };

  const eliminarProveedor = async () => {
    if (proveedorAEliminar) {
      try {
        await deleteDoc(doc(db, "proveedores", proveedorAEliminar.id));
        setProveedores((prev) =>
          prev.filter((p) => p.id !== proveedorAEliminar.id)
        );
        setConfirmModal(false);
      } catch (err) {
        console.error("Error al eliminar proveedor:", err);
        alert("Ocurrió un error al eliminar el proveedor.");
      }
    }
  };

  const verEstadoCuenta = async (tallerId) => {
    try {
      const data = await obtenerReparacionesPorTaller(tallerId);
      setReparacionesTaller(data);
      setEstadoCuentaModalAbierto(true);
    } catch (err) {
      console.error("Error al cargar reparaciones del taller:", err);
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
          verEstadoCuenta={verEstadoCuenta}
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

      {estadoCuentaModalAbierto && (
        <EstadoCuentaModal
          abierto={estadoCuentaModalAbierto}
          onClose={() => setEstadoCuentaModalAbierto(false)}
          reparaciones={reparacionesTaller}
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
