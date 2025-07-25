import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { LoaderCircle, AlertTriangle, PlusCircle, Search, ShieldAlert, Wallet, HardHat, Truck, Store } from "lucide-react";
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
  const [vehiculos, setVehiculos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    conDeuda: 0,
    tipos: {}
  });

  const [reparacionesTaller, setReparacionesTaller] = useState([]);
  const [estadoCuentaModalAbierto, setEstadoCuentaModalAbierto] = useState(false);

  const obtenerReparacionesPorTaller = async (tallerId) => {
    const q = query(
      collection(db, "reparaciones"),
      where("tallerId", "==", tallerId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  useEffect(() => {
    const fetchProveedoresConDeuda = async () => {
      try {
        const snapshot = await getDocs(collection(db, "proveedores"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const dataConDeuda = await Promise.all(
          data.map(async (p) => {
            const reparaciones = await obtenerReparacionesPorTaller(p.id);
            const tieneDeuda = reparaciones.some((r) => r.saldo > 0);
            const totalDeuda = reparaciones.reduce((sum, r) => sum + (r.saldo || 0), 0);
            return { ...p, tieneDeuda, totalDeuda };
          })
        );

        // Calcular estadísticas
        const tiposCount = dataConDeuda.reduce((acc, p) => {
          acc[p.tipo] = (acc[p.tipo] || 0) + 1;
          return acc;
        }, {});

        setStats({
          total: dataConDeuda.length,
          conDeuda: dataConDeuda.filter(p => p.tieneDeuda).length,
          tipos: tiposCount
        });

        setProveedores(dataConDeuda);
      } catch (err) {
        console.error("Error al obtener proveedores o reparaciones:", err);
        setError("Error al cargar los proveedores.");
      } finally {
        setLoading(false);
      }
    };

    const fetchVehiculos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "vehiculos"));
        const vehiculosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVehiculos(vehiculosData);
      } catch (err) {
        console.error("Error al obtener vehículos:", err);
      }
    };

    fetchProveedoresConDeuda();
    fetchVehiculos();
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
    `${p.nombre} ${p.tipo} ${p.contacto || ''}`.toLowerCase().includes(busqueda)
  );

  // Iconos por tipo de proveedor
  const getTipoIcon = (tipo) => {
    switch(tipo.toLowerCase()) {
      case 'taller':
        return <HardHat className="text-yellow-500" />;
      case 'transportista':
        return <Truck className="text-blue-500" />;
      case 'proveedor':
        return <Store className="text-green-500" />;
      default:
        return <Store className="text-gray-500" />;
    }
  };

  return (
    <div className="p-6 pt-20 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-indigo-400" size={40} />
          Gestión de Proveedores
        </h1>
        <button
          onClick={() => {
            setProveedorSeleccionado(null);
            setModalAbierto(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center gap-2 transition-all hover: cursor-pointer"
        >
          <PlusCircle size={18} />
          Agregar Proveedor
        </button>
      </div>

      {/* Panel de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-800 p-4 rounded-lg border-l-4 border-indigo-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-slate-400">Total Proveedores</h3>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-indigo-500/20 p-3 rounded-full">
              <Store className="text-indigo-400" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-800 p-4 rounded-lg border-l-4 border-red-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-slate-400">Con deuda</h3>
              <p className="text-2xl font-bold">{stats.conDeuda}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-full">
              <Wallet className="text-red-400" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-800 p-4 rounded-lg border-l-4 border-green-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-slate-400">Tipos</h3>
              <div className="flex gap-2 mt-1">
                {Object.entries(stats.tipos).map(([tipo, count]) => (
                  <span key={tipo} className="text-xs bg-slate-700 px-2 py-1 rounded-full flex items-center gap-1">
                    {getTipoIcon(tipo)}
                    {count} {tipo}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-slate-400" size={18} />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, tipo o contacto..."
          value={busqueda}
          onChange={handleBusqueda}
          className="bg-slate-800 p-2 pl-10 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <LoaderCircle className="mx-auto" size={32} />
          </motion.div>
          <p className="mt-2">Cargando proveedores...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-700 rounded-md p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400" size={24} />
          <div>
            <h3 className="font-bold">Error al cargar proveedores</h3>
            <p className="text-sm text-slate-300">{error}</p>
          </div>
        </div>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="text-center py-10">
          <div className="bg-slate-800/50 rounded-full p-4 inline-block">
            <Search className="mx-auto text-slate-500" size={32} />
          </div>
          <h3 className="mt-3 text-lg font-medium">No se encontraron proveedores</h3>
          <p className="text-slate-400 mt-1">
            {busqueda ? 
              "No hay coincidencias con tu búsqueda" : 
              "No hay proveedores registrados aún"}
          </p>
          {!busqueda && (
            <button
              onClick={() => setModalAbierto(true)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md inline-flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Agregar primer proveedor
            </button>
          )}
        </div>
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
          getTipoIcon={getTipoIcon}
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
          vehiculos={vehiculos}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          abierto={confirmModal}
          title="Eliminar Proveedor"
          message={`¿Estás seguro de que quieres eliminar al proveedor ${proveedorAEliminar?.nombre}? Esta acción no se puede deshacer.`}
          onConfirm={eliminarProveedor}
          onCancel={() => setConfirmModal(false)}
          danger
        />
      )}
    </div>
  );
}