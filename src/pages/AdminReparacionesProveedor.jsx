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
  CreditCard,
  Wallet,
  Calendar,
  FileDown,
  LoaderCircle,
  Info,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import ModalNuevaReparacion from "../components/reparaciones/ModalNuevaReparacion";
import ConfirmModal from "../components/ConfirmModal";
import dayjs from 'dayjs';
import ModalRegistrarPago from "../components/proveedores/ModalRegistrarPago";

// CONSTANTES
const ITEMS_POR_PAGINA = 5;

export default function Reparaciones() {
  const [reparaciones, setReparaciones] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculosEnReparacion, setVehiculosEnReparacion] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const fecha = new Date();
  const soloFecha = dayjs(fecha).format('DD/MM/YYYY');

  const [loading, setLoading] = useState(true);
  const [loadingVehEnRep, setLoadingVehEnRep] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [reparacionAEliminar, setReparacionAEliminar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reparacionEditar, setReparacionEditar] = useState(null);
  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [reparacionParaPago, setReparacionParaPago] = useState(null);

  // Filtros
  const [filtroTaller, setFiltroTaller] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [seccionVehRepAbierta, setSeccionVehRepAbierta] = useState(true);

  const refrescarReparaciones = async () => {
    setLoading(true);
    const reparacionesSnapshot = await getDocs(collection(db, "reparaciones"));
    setReparaciones(reparacionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

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
        setConfirmModalOpen(false);
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
    if (!r || !r.descripcionReparacion) return false;

    const vehiculo = obtenerVehiculo(r.vehiculoId);
    const taller = obtenerTaller(r.tallerId);

    const textoBuscado = busqueda.toLowerCase();

    const descripcionOk = r.descripcionReparacion.toLowerCase().includes(textoBuscado);
    const proveedorOk = taller?.nombre?.toLowerCase().includes(textoBuscado) || false;
    const patenteOk = vehiculo?.patente?.toLowerCase().includes(textoBuscado) || false;
    const marcaOk = vehiculo?.marca?.toLowerCase().includes(textoBuscado) || false;
    const modeloOk = vehiculo?.modelo?.toLowerCase().includes(textoBuscado) || false;

    const textoOk = descripcionOk || proveedorOk || patenteOk || marcaOk || modeloOk;
    const tallerOk = !filtroTaller || r.tallerId === filtroTaller;

    const fechaCreado = r.creadoEn ? new Date(r.creadoEn.seconds * 1000) : null;
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

  const editarReparacion = (reparacionId) => {
    const rep = reparaciones.find((r) => r.id === reparacionId);
    if (!rep) {
      console.warn("No se encontró la reparación con id:", reparacionId);
      return;
    }
    setReparacionEditar(rep);
    setModalVisible(true);
  };

  const abrirModalPago = (reparacion) => {
    setReparacionParaPago(reparacion);
    setModalPagoVisible(true);
  };

  return (
    <div className="p-20 max-w-6xl mx-auto text-slate-200 min-h-screen">
      <div className="rounded-xl shadow-2xl border border-indigo-500 overflow-hidden p-5">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-6 text-center flex justify-center items-center gap-2">
        <Wrench className="w-10 h-10 text-slate-500 animate-bounce" />
        Gestión de Reparaciones
      </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administra y registra todas las reparaciones de vehículos
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setReparacionEditar(null);
              setModalVisible(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nueva Reparación</span>
          </button>
          
          <button
            onClick={exportarExcel}
            className="flex gap-2 items-center bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg drop-shadow-2xl z-50 flex items-center gap-2 ${
              toast.tipo === "error" ? "bg-gradient-to-r from-red-600 to-red-500" : "bg-gradient-to-r from-green-600 to-green-500"
            }`}
          >
            {toast.tipo === "error" ? <AlertTriangle size={18} /> : <Info size={18} />}
            {toast.mensaje}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BUSCADOR PRINCIPAL */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar reparaciones por descripción, patente o taller..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          className="block w-full pl-10 pr-3 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* FILTROS AVANZADOS */}
      <div className="mb-6">
        <button
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
          className="flex items-center gap-2 text-slate-300 hover:text-white mb-3 transition-colors"
        >
          {filtrosAbiertos ? (
            <ChevronUp size={16} className="text-indigo-400" />
          ) : (
            <ChevronDown size={16} className="text-indigo-400" />
          )}
          <span className="font-medium">{filtrosAbiertos ? 'Ocultar filtros' : 'Mostrar filtros avanzados'}</span>
        </button>

        {filtrosAbiertos && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900/60 p-4 rounded-xl shadow-lg border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Taller
              </label>
              <select
                value={filtroTaller}
                onChange={(e) => {
                  setFiltroTaller(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">Todos los talleres</option>
                {talleres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full bg-slate-800 p-2 rounded-md border border-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Vehículos en reparación */}
      <section className="mb-8 border border-indigo-500/30 rounded-lg p-4 bg-gradient-to-br from-slate-900/50 to-indigo-900/10">
        <div 
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => setSeccionVehRepAbierta(!seccionVehRepAbierta)}
        >
          <h2 className="text-xl font-semibold text-indigo-300 flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Vehículos en Reparación
            <span className="text-sm bg-indigo-900/30 text-indigo-300 px-2 py-1 rounded-full ml-2">
              {vehiculosEnReparacion.length}
            </span>
          </h2>
          {seccionVehRepAbierta ? (
            <ChevronUp className="text-indigo-400" />
          ) : (
            <ChevronDown className="text-indigo-400" />
          )}
        </div>

        {seccionVehRepAbierta && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {loadingVehEnRep ? (
              <div className="flex justify-center py-6">
                <LoaderCircle className="animate-spin text-indigo-400 h-6 w-6" />
              </div>
            ) : vehiculosEnReparacion.length === 0 ? (
              <div className="text-center py-6 bg-slate-800/30 rounded-lg">
                <p className="text-slate-400">No hay vehículos en reparación actualmente</p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehiculosEnReparacion.map((v) => (
                  <motion.li
                    key={v.id}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-800/50 p-4 rounded-lg shadow hover:shadow-lg transition-all border border-slate-700/50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg text-indigo-300">{v.patente}</p>
                        <p className="text-sm text-slate-300">
                          {v.marca} {v.modelo} • {v.año}
                        </p>
                      </div>
                      <span className="bg-indigo-900/30 text-indigo-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <LoaderCircle className="h-3 w-3 animate-spin" />
                        En taller
                      </span>
                    </div>
                    {v.descripcionProblema && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-400 mb-1">PROBLEMA REPORTADO</p>
                        <p className="text-sm text-slate-300">
                          {v.descripcionProblema}
                        </p>
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </section>

      {/* Listado de reparaciones */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Historial de Reparaciones
          </h2>
          <span className="text-sm text-slate-400">
            Mostrando {reparacionesPagina.length} de {reparacionesFiltradas.length} reparaciones
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoaderCircle className="animate-spin text-indigo-400 h-8 w-8" />
          </div>
        ) : reparacionesFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
            <FileText className="mx-auto h-12 w-12 text-slate-500 mb-3" />
            <h3 className="text-lg font-medium text-slate-300">No se encontraron reparaciones</h3>
            <p className="mt-1 text-slate-500 mb-4">
              {busqueda || filtroTaller || fechaDesde || fechaHasta
                ? "Prueba con otros criterios de búsqueda"
                : "No hay reparaciones registradas aún"}
            </p>
            <button
              onClick={() => {
                setBusqueda("");
                setFiltroTaller("");
                setFechaDesde("");
                setFechaHasta("");
                setModalVisible(true);
              }}
              className="mt-2 inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-lg text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear primera reparación
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {reparacionesPagina.map((r) => {
                const vehiculo = obtenerVehiculo(r.vehiculoId);
                const taller = obtenerTaller(r.tallerId);
                const fechaReparacion = r.fecha?.toDate ? r.fecha.toDate() : null;
                const fechaCreacion = r.creadoEn ? new Date(r.creadoEn.seconds * 1000) : null;

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-800/50 border border-slate-700/50 p-5 rounded-xl shadow hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="bg-indigo-900/30 p-2 rounded-lg">
                            <Wrench className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {r.descripcionReparacion}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                              {vehiculo
                                ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
                                : "Vehículo desconocido"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-slate-300 bg-slate-800/50 px-2 py-1 rounded-md">
                          {fechaCreacion ? dayjs(fechaCreacion).format('DD/MM/YYYY') : '—'}
                        </span>
                        {taller && (
                          <div className="flex items-center gap-2 mt-2 bg-slate-800/50 px-2 py-1 rounded-md">
                            <Factory className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm text-indigo-300">{taller.nombre}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Columna 1 */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-lg">
                          <div className="bg-blue-900/30 p-2 rounded-md">
                            <Calendar className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Fecha reparación</p>
                            <p className="text-sm text-white">
                              {fechaReparacion ? dayjs(fechaReparacion).format('DD/MM/YYYY') : '—'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-lg">
                          <div className="bg-cyan-900/30 p-2 rounded-md">
                            <Settings className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Mano de obra</p>
                            <p className="text-sm text-lime-400">
                              {r.precioManoObra?.toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS",
                                minimumFractionDigits: 0,
                              }) || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Columna 2 */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-lg">
                          <div className="bg-orange-900/30 p-2 rounded-md">
                            <Hammer className="w-4 h-4 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Repuestos</p>
                            <p className="text-sm text-lime-400">
                              {r.precioRepuestos?.toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS",
                                minimumFractionDigits: 0,
                              }) || "—"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-lg">
                          <div className="bg-green-900/30 p-2 rounded-md">
                            <DollarSign className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Total</p>
                            <p className="text-sm font-semibold text-lime-500">
                              {r.precioTotal?.toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS",
                                minimumFractionDigits: 0,
                              }) || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Columna 3 */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-lg">
                          <div className="bg-yellow-900/30 p-2 rounded-md">
                            <CreditCard className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Estado pago</p>
                            <p className={`text-sm font-medium ${
                              r.estadoPago === 'Pagado' ? 'text-green-400' : 
                              r.estadoPago === 'Parcial' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {r.estadoPago || "Pendiente"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-lg">
                          <div className="bg-emerald-900/30 p-2 rounded-md">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Saldo</p>
                            <p className="text-sm font-semibold text-yellow-500">
                              {typeof r.saldo === "number"
                                ? r.saldo.toLocaleString("es-AR", {
                                    style: "currency",
                                    currency: "ARS",
                                    minimumFractionDigits: 0,
                                  })
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {r.observaciones && (
                      <div className="mt-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <FilePlus className="w-4 h-4" />
                          <span className="text-xs font-medium">OBSERVACIONES</span>
                        </div>
                        <p className="text-sm text-slate-300 pl-6">{r.observaciones}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => abrirModalPago(r)}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all ${
                          r.estadoPago === 'Pagado' 
                            ? 'bg-green-800/30 text-green-300 hover:bg-green-800/50 border border-green-800/50'
                            : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-md hover:shadow-lg'
                        }`}
                        title="Registrar pago"
                      >
                        <DollarSign size={16} />
                        <span>Pago</span>
                      </button>
                      
                      <button
                        onClick={() => editarReparacion(r.id)}
                        className="px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg flex items-center gap-1"
                        title="Editar reparación"
                      >
                        <Pencil size={16} />
                        <span>Editar</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setReparacionAEliminar(r);
                          setConfirmModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md hover:shadow-lg flex items-center gap-1"
                        title="Eliminar reparación"
                      >
                        <Trash2 size={16} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-sm text-slate-400">
                  Mostrando {(paginaActual - 1) * ITEMS_POR_PAGINA + 1} -{' '}
                  {Math.min(paginaActual * ITEMS_POR_PAGINA, reparacionesFiltradas.length)} de{' '}
                  {reparacionesFiltradas.length} reparaciones
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft size={16} />
                    <span>Anterior</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pageNum;
                      if (totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (paginaActual <= 3) {
                        pageNum = i + 1;
                      } else if (paginaActual >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i;
                      } else {
                        pageNum = paginaActual - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPaginaActual(pageNum)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                            paginaActual === pageNum
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPaginas > 5 && paginaActual < totalPaginas - 2 && (
                      <span className="mx-1 text-slate-400">...</span>
                    )}
                    
                    {totalPaginas > 5 && paginaActual < totalPaginas - 2 && (
                      <button
                        onClick={() => setPaginaActual(totalPaginas)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          paginaActual === totalPaginas
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {totalPaginas}
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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

      <ConfirmModal
        isOpen={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={eliminarReparacion}
        title="Confirmar eliminación"
        message="¿Estás seguro que quieres eliminar esta reparación? Esta acción no se puede deshacer."
      />
     
      <ModalRegistrarPago
        visible={modalPagoVisible}
        onClose={() => setModalPagoVisible(false)}
        reparacionId={reparacionParaPago?.id}
        onPagoRealizado={refrescarReparaciones}
        tallerId={reparacionParaPago?.tallerId}
        vehiculoId={reparacionParaPago?.vehiculoId}
      />
    </div>
    </div>
  );
}