import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Pencil,
  Trash2,
  MessageCircle,
  LoaderCircle,
  FileDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import ModalNuevaReparacion from "../components/reparaciones/ModalNuevaReparacion";

// CONSTANTES
const ITEMS_POR_PAGINA = 5;

export default function Reparaciones() {
  const [reparaciones, setReparaciones] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [reparacionAEliminar, setReparacionAEliminar] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [reparacionEditar, setReparacionEditar] = useState(null);

  const mostrarToast = (mensaje, tipo = "ok") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const obtenerVehiculo = (id) => vehiculos.find((v) => v.id === id);
  const obtenerTaller = (id) => talleres.find((t) => t.id === id);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repSnap, vehSnap, talSnap] = await Promise.all([
        getDocs(collection(db, "reparaciones")),
        getDocs(collection(db, "vehiculos")),
        getDocs(collection(db, "proveedores")),
      ]);
      setReparaciones(repSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setVehiculos(vehSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTalleres(talSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      mostrarToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const eliminarReparacion = async () => {
    if (reparacionAEliminar) {
      try {
        await deleteDoc(doc(db, "reparaciones", reparacionAEliminar.id));
        setReparaciones((prev) =>
          prev.filter((p) => p.id !== reparacionAEliminar.id)
        );
        setConfirmModal(false);
        mostrarToast("Reparación eliminada correctamente");
      } catch (error) {
        mostrarToast("Error al eliminar reparación", "error");
      }
    }
  };

  const exportarExcel = () => {
    const data = reparaciones.map((r) => ({
      Descripción: r.descripcionReparacion,
      Vehículo: obtenerVehiculo(r.vehiculoId)?.patente || "Desconocido",
      Taller: obtenerTaller(r.tallerId)?.nombre || "Desconocido",
      Precio: r.precioServicio,
      Observaciones: r.observaciones || "",
      CreadoPor: r.creadoPor || "",
      FechaCreado: r.creadoEn
        ? new Date(r.creadoEn.seconds * 1000).toLocaleString()
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reparaciones");
    XLSX.writeFile(wb, "reparaciones.xlsx");
  };

  const reparacionesFiltradas = reparaciones.filter((r) =>
    r.descripcionReparacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(
    reparacionesFiltradas.length / ITEMS_POR_PAGINA
  );

  const reparacionesPagina = reparacionesFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Reparaciones</h1>

      {/* Toast */}
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

      {/* Acciones */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          className="bg-slate-800 p-2 rounded-md w-full max-w-md"
        />
        <button
          onClick={exportarExcel}
          className="flex gap-2 items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md"
        >
          <FileDown size={18} /> Exportar
        </button>

        <button
          onClick={() => {
            setReparacionEditar(null); // Crear nuevo
            setModalVisible(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md"
        >
          + Nueva Reparación
        </button>
      </div>

      {/* Estado de carga */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">
          <LoaderCircle className="animate-spin mx-auto" size={32} />
          Cargando reparaciones...
        </div>
      ) : reparacionesFiltradas.length === 0 ? (
        <p className="text-center text-slate-400">
          No se encontraron reparaciones.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {reparacionesPagina.map((r) => {
              const vehiculo = obtenerVehiculo(r.vehiculoId);
              const taller = obtenerTaller(r.tallerId);
              const numeroWhatsApp = r.telefono?.replace(/\D/g, "");

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-700 p-4 rounded-lg shadow flex justify-between items-start"
                >
                  <div>
                    <p className="text-lg font-bold">
                      {r.descripcionReparacion}
                    </p>
                    <p className="text-sm text-slate-300">
                      Vehículo: {vehiculo?.patente || "Desconocido"} (
                      {vehiculo?.modelo})
                    </p>

                    <p>
                      Mano de Obra: ${Number(r.precioManoObra ?? 0).toFixed(2)}
                    </p>
                    <p>
                      Repuestos: ${Number(r.precioRepuestos ?? 0).toFixed(2)}
                    </p>
                    <p>
                      <strong>
                        Total: ${Number(r.precioTotal ?? 0).toFixed(2)}
                      </strong>
                    </p>

                    <p className="text-sm text-slate-400">
                      Precio: ${r.precioServicio}
                    </p>
                    {r.observaciones && (
                      <p className="text-xs text-slate-400 mt-1">
                        📝 {r.observaciones}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {numeroWhatsApp && (
                      <a
                        href={`https://wa.me/${numeroWhatsApp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-600"
                      >
                        <MessageCircle />
                      </a>
                    )}
                    <button
                      className="text-indigo-400 hover:text-indigo-600"
                      onClick={() => {
                        setReparacionEditar(r);
                        setModalVisible(true);
                      }}
                      aria-label="Editar reparación"
                    >
                      <Pencil />
                    </button>
                    <button
                      className="text-red-400 hover:text-red-600"
                      onClick={() => {
                        setReparacionAEliminar(r);
                        setConfirmModal(true);
                      }}
                      aria-label="Eliminar reparación"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Paginación */}
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i}
                onClick={() => setPaginaActual(i + 1)}
                className={`px-3 py-1 rounded-md ${
                  paginaActual === i + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Modal creación/edición */}
      <ModalNuevaReparacion
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchData}
        reparacion={reparacionEditar}
      />

      {/* Confirmación eliminación */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-white max-w-sm w-full">
              <h2 className="text-xl font-bold mb-2">Eliminar reparación</h2>
              <p className="mb-4">
                ¿Estás seguro de que querés eliminar la reparación "
                <span className="font-semibold">
                  {reparacionAEliminar?.descripcionReparacion}
                </span>
                "?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="bg-slate-600 hover:bg-slate-700 px-3 py-1 rounded-md"
                  onClick={() => setConfirmModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
                  onClick={eliminarReparacion}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
