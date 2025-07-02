import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
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
  const [vehiculosEnReparacion, setVehiculosEnReparacion] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingVehEnRep, setLoadingVehEnRep] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [reparacionAEliminar, setReparacionAEliminar] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [reparacionEditar, setReparacionEditar] = useState(null);

  // NUEVOS filtros
  const [filtroTaller, setFiltroTaller] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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

  // Cargar vehículos con etiqueta diferente a "vendido" y "reparacion" (para listar disponibles)
  const fetchVehiculosEnReparacion = async () => {
    try {
      setLoadingVehEnRep(true);
      const q = query(collection(db, "vehiculos"), where("etiqueta", "==", "Reparación"));
      const snapshot = await getDocs(q);
      setVehiculosEnReparacion(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      mostrarToast("Error al cargar vehículos en reparación", "error");
    } finally {
      setLoadingVehEnRep(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchVehiculosEnReparacion();
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

  // FILTRADO
  const reparacionesFiltradas = reparaciones.filter((r) => {
    const textoOk = r.descripcionReparacion
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const tallerOk = !filtroTaller || r.tallerId === filtroTaller;

    const fechaCreado = r.creadoEn
      ? new Date(r.creadoEn.seconds * 1000)
      : null;

    const fechaDesdeOk = !fechaDesde || (fechaCreado && fechaCreado >= new Date(fechaDesde));
    const fechaHastaOk = !fechaHasta || (fechaCreado && fechaCreado <= new Date(fechaHasta));

    return textoOk && tallerOk && fechaDesdeOk && fechaHastaOk;
  });

  // Paginación
  const totalPaginas = Math.ceil(reparacionesFiltradas.length / ITEMS_POR_PAGINA);
  const reparacionesPagina = reparacionesFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Reparaciones</h1>

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

      {/* FILTROS */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Buscar descripción..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          className="bg-slate-800 p-2 rounded-md flex-grow max-w-md"
        />

        <select
          value={filtroTaller}
          onChange={(e) => {
            setFiltroTaller(e.target.value);
            setPaginaActual(1);
          }}
          className="bg-slate-800 p-2 rounded-md"
        >
          <option value="">Todos los talleres</option>
          {talleres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-slate-300" htmlFor="fechaDesde">
            Desde:
          </label>
          <input
            id="fechaDesde"
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setPaginaActual(1);
            }}
            className="bg-slate-800 p-2 rounded-md"
          />
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-slate-300" htmlFor="fechaHasta">
            Hasta:
          </label>
          <input
            id="fechaHasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setPaginaActual(1);
            }}
            className="bg-slate-800 p-2 rounded-md"
          />
        </div>

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

      {/* NUEVO BLOQUE - VEHÍCULOS EN REPARACIÓN */}
      <section className="mb-8 border border-indigo-500 rounded-md p-4">
        <h2 className="text-xl font-semibold mb-3">Vehículos en Reparación</h2>

        {loadingVehEnRep ? (
          <div className="text-center text-slate-400 py-4">
            <LoaderCircle className="animate-spin mx-auto" size={24} />
            Cargando vehículos en reparación...
          </div>
        ) : vehiculosEnReparacion.length === 0 ? (
          <p className="text-slate-400">No hay vehículos en reparación actualmente.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehiculosEnReparacion.map((v) => (
              <li
                key={v.id}
                className="bg-slate-700 p-4 rounded shadow cursor-default"
              >
                <p className="font-bold text-lg">{v.patente}</p>
                <p className="text-sm text-slate-300">{v.modelo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* LISTADO DE REPARACIONES */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">
          <LoaderCircle className="animate-spin mx-auto" size={32} />
          Cargando reparaciones...
        </div>
      ) : reparacionesFiltradas.length === 0 ? (
        <p className="text-center text-slate-400">
          No se encontraron reparaciones con esos filtros.
        </p>
      ) : (
        <>
          {/* LISTADO */}
          <div className="space-y-4 mb-8 border border-indigo-500 rounded-md p-4">
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
                    <p className="text-lg font-bold">{r.descripcionReparacion}</p>
                    <p className="text-sm text-slate-300">
                      Vehículo: {vehiculo?.patente || "Desconocido"} - {vehiculo?.modelo || ""}
                    </p>
                    <p className="text-sm text-slate-300">
                      Taller: {taller?.nombre || "Desconocido"}
                    </p>
                    <p className="text-sm">Precio: ${r.precioServicio}</p>
                    <p className="text-sm text-slate-300">
                      Observaciones: {r.observaciones || "Ninguna"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setReparacionEditar(r);
                        setModalVisible(true);
                      }}
                      title="Editar"
                      className="p-2 rounded hover:bg-indigo-600"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => {
                        setReparacionAEliminar(r);
                        setConfirmModal(true);
                      }}
                      title="Eliminar"
                      className="p-2 rounded hover:bg-red-700"
                    >
                      <Trash2 size={18} />
                    </button>

                    {numeroWhatsApp && (
                      <a
                        href={`https://wa.me/56${numeroWhatsApp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp"
                        className="p-2 rounded hover:bg-green-700"
                      >
                        <MessageCircle size={18} />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* PAGINACIÓN */}
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="bg-slate-600 px-3 py-1 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="bg-slate-600 px-3 py-1 rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* MODAL NUEVA REPARACION */}
      {modalVisible && (
        <ModalNuevaReparacion
          reparacionEditar={reparacionEditar}
          setModalVisible={setModalVisible}
          talleres={talleres}
          vehiculos={vehiculos}
          onSave={(nuevaReparacion) => {
            if (reparacionEditar) {
              setReparaciones((prev) =>
                prev.map((r) => (r.id === reparacionEditar.id ? nuevaReparacion : r))
              );
            } else {
              setReparaciones((prev) => [nuevaReparacion, ...prev]);
            }
            setModalVisible(false);
            mostrarToast(
              reparacionEditar
                ? "Reparación actualizada"
                : "Reparación creada correctamente"
            );
          }}
        />
      )}

      {/* MODAL CONFIRMAR ELIMINACION */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Confirmar eliminación</h3>
            <p className="mb-4">
              ¿Estás seguro que quieres eliminar esta reparación?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmModal(false)}
                className="bg-slate-600 px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarReparacion}
                className="bg-red-700 px-4 py-2 rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
