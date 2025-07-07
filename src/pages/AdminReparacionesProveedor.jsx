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
import {
  Factory,
  FileText,
  Hammer,
  KeyRound,
  Settings,
  User,
  Wrench,
  DollarSign,
  FilePlus,
  Trash2,
  Pencil,
  MessageCircle,
  Car,
  Building,
  FileDown,
  LoaderCircle,
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
      const q = query(
        collection(db, "vehiculos"),
        where("etiqueta", "==", "Reparación")
      );
      const snapshot = await getDocs(q);
      setVehiculosEnReparacion(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
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

    const fechaCreado = r.creadoEn ? new Date(r.creadoEn.seconds * 1000) : null;

    const fechaDesdeOk =
      !fechaDesde || (fechaCreado && fechaCreado >= new Date(fechaDesde));
    const fechaHastaOk =
      !fechaHasta || (fechaCreado && fechaCreado <= new Date(fechaHasta));

    return textoOk && tallerOk && fechaDesdeOk && fechaHastaOk;
  });

  // Paginación
  const totalPaginas = Math.ceil(
    reparacionesFiltradas.length / ITEMS_POR_PAGINA
  );
  const reparacionesPagina = reparacionesFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  const editarReparacion = (reparacionId) => {
    const rep = reparaciones.find((r) => r.id === reparacionId);
    const vehiculo = vehiculos.find((v) => v.id === rep.vehiculoId);
    setReparacionEditar(rep);
    setModalVisible(true); // Mostrar modal para editar
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <h1 className="text-3xl font-extrabold text-white mb-6 tracking-tight">
        Reparaciones
      </h1>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg drop-shadow-2xl z-50 flex items-center gap-2 ${
              toast.tipo === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            <Info size={18} /> {toast.mensaje}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-4 mb-6 items-center bg-slate-900/60 p-4 rounded-xl shadow-lg border border-slate-700">
        <input
          type="text"
          placeholder="🔍 Buscar reparación..."
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
          <option value="">🏭 Todos los talleres</option>
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
            setReparacionEditar(null);
            setModalVisible(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md"
        >
          + Nueva Reparación
        </button>
      </div>

      {/* Vehículos en reparación */}
      <section className="mb-8 border border-indigo-500 rounded-md p-4">
        <h2 className="text-xl font-semibold mb-3 text-indigo-300">
          Vehículos en Reparación
        </h2>

        {loadingVehEnRep ? (
          <div className="text-center text-slate-400 py-4">
            <LoaderCircle className="animate-spin mx-auto" size={24} />
            Cargando vehículos en reparación...
          </div>
        ) : vehiculosEnReparacion.length === 0 ? (
          <p className="text-slate-400">
            No hay vehículos en reparación actualmente.
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehiculosEnReparacion.map((v) => (
              <li
                key={v.id}
                className="bg-slate-700 p-4 rounded shadow hover:scale-[1.01] transition-transform border-l-4 border-indigo-400"
              >
                <p className="font-bold text-lg text-indigo-300">{v.patente}</p>
                <p className="text-sm text-slate-300">{v.modelo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Listado de reparaciones */}
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
          <div className="space-y-6 mb-12 border border-indigo-500 rounded-2xl p-6 bg-indigo-900/80 shadow-xl">
            {reparacionesPagina.map((r) => {
              const vehiculo = obtenerVehiculo(r.vehiculoId);
              const taller = obtenerTaller(r.tallerId);
              const numeroWhatsApp = r.telefono?.replace(/\D/g, "");

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-gradient-to-br from-slate-800 to-slate-700/70 backdrop-blur-sm border border-slate-600 p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-yellow-400" />
                      Reparación
                      <span>
                        Vehículo:{" "}
                        <strong>
                          {vehiculo
                            ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
                            : "Desconocido"}
                        </strong>
                      </span>
                    </h3>
                    <span className="text-sm text-slate-400">
                      {r.creadoEn
                        ? new Date(
                            r.creadoEn.seconds * 1000
                          ).toLocaleDateString("es-AR")
                        : "—"}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-pink-400" />
                      <strong className="text-slate-300">Descripción:</strong>
                      <span>{r.descripcionReparacion}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <strong>Mano de obra:</strong>
                      <span className="text-lime-400">
                        {r.precioManoObra?.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        }) || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hammer className="w-4 h-4 text-orange-400" />
                      <strong>Repuestos:</strong>
                      <span className="text-lime-400">
                        {r.precioRepuestos?.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        }) || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <strong>Total:</strong>
                      <span className="text-lime-500 font-semibold">
                        {r.precioTotal?.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        }) || "—"}
                      </span>
                    </div>
                    {r.observaciones && (
                      <div className="col-span-2 flex gap-2 items-start mt-1">
                        <FilePlus className="w-4 h-4 text-indigo-400 mt-0.5" />
                        <p className="text-sm text-slate-400 italic">
                          {r.observaciones}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Taller y contacto */}
                  <div className="mt-3 space-y-1 text-sm text-slate-300">
                    {taller && (
                      <div className="flex items-center gap-2 text-cyan-300">
                        <Factory className="w-4 h-4" />
                        <span>{taller.nombre}</span>
                      </div>
                    )}
                    {r.telefono && (
                      <div className="flex items-center gap-2 text-amber-300">
                        <User className="w-4 h-4" />
                        <span>{r.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex justify-center gap-4 mt-4 text-lg">
                    <button
                      onClick={() => editarReparacion(r.id)}
                      className="text-indigo-300 hover:text-indigo-500"
                      title="Editar reparación"
                    >
                      <Hammer />
                    </button>
                    <button
                      onClick={() => eliminarReparacion(r.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Eliminar reparación"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* PAGINACIÓN */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="text-sm text-slate-300 self-center">
              Página <strong>{paginaActual}</strong> de {totalPaginas}
            </span>
            <button
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaActual === totalPaginas}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </>
      )}

      {/* MODAL NUEVA REPARACIÓN */}
      {modalVisible && (
        <ModalNuevaReparacion
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={(nuevaReparacion) => {
            if (reparacionEditar) {
              setReparaciones((prev) =>
                prev.map((r) =>
                  r.id === reparacionEditar.id ? nuevaReparacion : r
                )
              );
            } else {
              setReparaciones((prev) => [nuevaReparacion, ...prev]);
            }
            mostrarToast(
              reparacionEditar
                ? "Reparación actualizada"
                : "Reparación creada correctamente"
            );
          }}
          reparacion={reparacionEditar}
          vehiculo={vehiculos.find(
            (v) => v.id === reparacionEditar?.vehiculoId
          )}
        />
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} /> Confirmar eliminación
            </h3>
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
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
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
