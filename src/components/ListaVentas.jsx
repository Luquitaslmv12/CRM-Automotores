import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Trash2,
  Download,
  Loader2,
  Eye,
  User,
  Car,
  DollarSign,
  Calendar,
  KeyRound,
  CreditCard,
  UserCircle,
  ShoppingCart,
  FilePlus,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Filter,
  Hammer
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import exportarBoletoDOCX from "./boletos/exportarBoletoDOCX";
import TooltipWrapper from "./Tooltip/TooltipWrapper";
import exportarVentaPDF from "./boletos/exportarVentaPDF";

export default function ListaVentas() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmarId, setConfirmarId] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros y paginación
  const [filtroNombre, setFiltroNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 5;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ventasSnap, clientesSnap, vehiculosSnap, vehiculosPartePagoSnap] =
        await Promise.all([
          getDocs(collection(db, "ventas")),
          getDocs(collection(db, "clientes")),
          getDocs(collection(db, "vehiculos")),
          getDocs(collection(db, "vehiculosPartePago")),
        ]);

      const listaClientes = clientesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const listaVehiculos = vehiculosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      const mapaVehiculosPartePago = {};
      vehiculosPartePagoSnap.docs.forEach((doc) => {
        mapaVehiculosPartePago[doc.id] = doc.data();
      });

      const listaVentas = ventasSnap.docs
        .map((doc) => {
          const data = doc.data();
          const cliente = listaClientes.find((c) => c.id === data.clienteId);
          const vehiculo = listaVehiculos.find((v) => v.id === data.vehiculoId);
          const vehiculoPartePago =
            data.vehiculoPartePagoId && mapaVehiculosPartePago[data.vehiculoPartePagoId]
              ? mapaVehiculosPartePago[data.vehiculoPartePagoId]
              : null;

          return {
            id: doc.id,
            ...data,
            clienteNombre: cliente?.nombre || "Cliente no encontrado",
            clienteApellido: cliente?.apellido || "",
            dniCliente: cliente?.dni || "",
            clienteDireccion: cliente?.direccion || "",
            localidadCliente: cliente?.localidad || "",
            telefonoCliente: cliente?.telefono || "",
            emailCliente: cliente?.email || "",
            vehiculoResumen: vehiculo || null,
            vehiculoInfo: vehiculo
              ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
              : "Vehículo no encontrado",
            patenteVehiculo: vehiculo?.patente || "",
            vehiculoPartePago,
            fechaObj: data.fecha?.toDate ? data.fecha.toDate() : new Date(),
          };
        })
        .sort((a, b) => b.fechaObj - a.fechaObj);

      setClientes(listaClientes);
      setVehiculos(listaVehiculos);
      setVentas(listaVentas);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const eliminarVenta = async (id) => {
    try {
      await deleteDoc(doc(db, "ventas", id));
      toast.success("Venta eliminada");
      setVentas(ventas.filter((v) => v.id !== id));
      setConfirmarId(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar venta");
    }
  };

  const ventasFiltradas = useMemo(() => {
    const filtro = filtroNombre.toLowerCase().trim();
    return ventas.filter((v) => {
      const textoCoincide = [
        v.clienteNombre.toLowerCase(),
        v.clienteApellido.toLowerCase(),
        v.dniCliente.toString().toLowerCase(),
        v.vehiculoInfo.toLowerCase(),
        v.patenteVehiculo.toLowerCase(),
      ].some((campo) => campo.includes(filtro));

      if (!textoCoincide) return false;
      if (fechaInicio && dayjs(v.fechaObj).isBefore(dayjs(fechaInicio), "day"))
        return false;
      if (fechaFin && dayjs(v.fechaObj).isAfter(dayjs(fechaFin), "day"))
        return false;
      return true;
    });
  }, [ventas, filtroNombre, fechaInicio, fechaFin]);

  const totalPaginas = Math.ceil(ventasFiltradas.length / ITEMS_POR_PAGINA);
  const ventasPagina = ventasFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  const irAPagina = (num) => {
    if (num < 1 || num > totalPaginas) return;
    setPaginaActual(num);
  };

  

  const ventaDetalle = ventas.find((v) => v.id === detalleId);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto text-gray-100">
      {/* Header y Filtros */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">
            Historial de Ventas
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Filter size={16} />
              Filtros
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI, vehículo..."
            value={filtroNombre}
            onChange={(e) => {
              setFiltroNombre(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-600 bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            aria-label="Buscar ventas"
          />
        </div>

        {/* Filtros avanzados */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="w-full p-2 rounded-lg border border-gray-600 bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="w-full p-2 rounded-lg border border-gray-600 bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-400">
          Mostrando <span className="font-medium">{ventasPagina.length}</span> de{" "}
          <span className="font-medium">{ventasFiltradas.length}</span> ventas
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            Página {paginaActual} de {totalPaginas}
          </span>
        </div>
      </div>

      {/* Lista de ventas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
          <p className="text-gray-400">
            Cargando historial de ventas...
          </p>
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">
            No se encontraron ventas que coincidan con los filtros.
          </p>
          <button
            onClick={() => {
              setFiltroNombre("");
              setFechaInicio("");
              setFechaFin("");
            }}
            className="mt-4 text-blue-400 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {ventasPagina.map((venta) => (
              <motion.div
                key={venta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-gradient-to-br from-slate-800 to-slate-700/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-700 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    {/* Información principal */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-900/50">
                          <User className="text-blue-400" size={18} />
                        </div>
                        <h3 className="font-semibold text-lg text-white">
                          {venta.clienteNombre} {venta.clienteApellido}
                          {venta.dniCliente && (
                            <span className="ml-2 text-sm font-normal text-gray-400">
                              (DNI: {venta.dniCliente})
                            </span>
                          )}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-900/50">
                          <Car className="text-purple-400" size={18} />
                        </div>
                        <p className="text-gray-300">
                          {venta.vehiculoInfo}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="text-green-400" size={16} />
                          <span className="font-medium text-white">
                            ${Number(venta.monto).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="text-pink-400" size={16} />
                          <span className="text-gray-400">
                            {dayjs(venta.fechaObj).locale("es").format("DD/MM/YYYY")}
                          </span>
                        </div>
                      </div>

                      {venta.vehiculoPartePago && (
                        <div className="mt-2 flex items-center gap-2 text-sm bg-yellow-900/20 px-3 py-2 rounded-lg">
                          <KeyRound className="text-yellow-400" size={16} />
                          <span className="text-yellow-200">
                            <strong>Parte de pago:</strong> {venta.vehiculoPartePago.marca} {venta.vehiculoPartePago.modelo} ({venta.vehiculoPartePago.patente}) · ${Number(venta.vehiculoPartePago.monto).toLocaleString("es-AR")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex sm:flex-col gap-2 sm:gap-3">
                      <TooltipWrapper label="Ver detalles">
                        <button
                          onClick={() => setDetalleId(venta.id)}
                          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-blue-400"
                        >
                          <Eye size={20} />
                        </button>
                      </TooltipWrapper>

                      <TooltipWrapper label="Exportar boleto">
                        <button
                          onClick={() => exportarBoletoDOCX(venta)}
                          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-green-400"
                        >
                          <Download size={20} />
                        </button>
                      </TooltipWrapper>

                      <TooltipWrapper label="Eliminar venta">
                        <button
                          onClick={() => setConfirmarId(venta.id)}
                          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-red-400"
                        >
                          <Trash2 size={20} />
                        </button>
                      </TooltipWrapper>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <UserCircle className="flex-shrink-0 text-blue-500 mt-0.5" size={16} />
                        <div>
                          <p className="font-medium text-white">Tomado por</p>
                          <p className="text-gray-400">
                            {venta.vehiculoPartePago?.recibidoPor || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <ShoppingCart className="flex-shrink-0 text-green-500 mt-0.5" size={16} />
                        <div>
                          <p className="font-medium text-white">Vendido por</p>
                          <p className="text-gray-400">
                            {venta.vendidoPor || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <FilePlus className="flex-shrink-0 text-purple-500 mt-0.5" size={16} />
                        <div>
                          <p className="font-medium text-white">Creado por</p>
                          <p className="text-gray-400">
                            {venta.creadoPor || "—"} · {venta.creadoEn ? new Date(venta.creadoEn.seconds * 1000).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {venta.modificadoPor && (
                      <div className="mt-3 flex items-start gap-2 text-sm">
                        <Hammer className="flex-shrink-0 text-yellow-500 mt-0.5" size={16} />
                        <div>
                          <p className="font-medium text-white">Modificado por</p>
                          <p className="text-gray-400">
                            {venta.modificadoPor} · {venta.modificadoEn ? new Date(venta.modificadoEn.seconds * 1000).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            Mostrando {ITEMS_POR_PAGINA * (paginaActual - 1) + 1} -{" "}
            {Math.min(ITEMS_POR_PAGINA * paginaActual, ventasFiltradas.length)} de{" "}
            {ventasFiltradas.length} ventas
          </p>
          
          <div className="flex gap-1">
            <button
              onClick={() => irAPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>

            {[...Array(Math.min(5, totalPaginas)).keys()].map((i) => {
              // Lógica para mostrar páginas cercanas a la actual
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
                  onClick={() => irAPagina(pageNum)}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center text-sm font-medium transition-colors ${
                    paginaActual === pageNum
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-600 bg-gray-800 hover:bg-gray-700"
                  }`}
                  aria-current={paginaActual === pageNum ? "page" : undefined}
                  aria-label={`Página ${pageNum}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => irAPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="p-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {confirmarId && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white">
                  Confirmar eliminación
                </h3>
                <button
                  onClick={() => setConfirmarId(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmarId(null)}
                  className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminarVenta(confirmarId)}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de detalle */}
      <AnimatePresence>
        {detalleId && ventaDetalle && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-start">
                <h2 className="text-xl font-bold text-white">
                  Detalles completos de la venta
                </h2>
                <button
                  onClick={() => setDetalleId(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sección Cliente */}
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-4 text-white flex items-center gap-2">
                      <User className="text-blue-500" size={20} />
                      Información del cliente
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Nombre completo</p>
                        <p className="font-medium">
                          {ventaDetalle.clienteNombre} {ventaDetalle.clienteApellido}
                        </p>
                      </div>
                      {ventaDetalle.dniCliente && (
                        <div>
                          <p className="text-sm text-gray-400">DNI</p>
                          <p className="font-medium">{ventaDetalle.dniCliente}</p>
                        </div>
                      )}
                      {ventaDetalle.telefonoCliente && (
                        <div>
                          <p className="text-sm text-gray-400">Teléfono</p>
                          <p className="font-medium">{ventaDetalle.telefonoCliente}</p>
                        </div>
                      )}
                      {ventaDetalle.emailCliente && (
                        <div>
                          <p className="text-sm text-gray-400">Email</p>
                          <p className="font-medium">{ventaDetalle.emailCliente}</p>
                        </div>
                      )}
                      {ventaDetalle.clienteDireccion && (
                        <div>
                          <p className="text-sm text-gray-400">Dirección</p>
                          <p className="font-medium">
                            {ventaDetalle.clienteDireccion}
                            {ventaDetalle.localidadCliente && `, ${ventaDetalle.localidadCliente}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección Vehículo */}
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-4 text-white flex items-center gap-2">
                      <Car className="text-purple-500" size={20} />
                      Información del vehículo
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Vehículo</p>
                        <p className="font-medium">{ventaDetalle.vehiculoInfo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Patente</p>
                        <p className="font-medium">{ventaDetalle.patenteVehiculo}</p>
                      </div>
                      {ventaDetalle.vehiculoResumen?.año && (
                        <div>
                          <p className="text-sm text-gray-400">Año</p>
                          <p className="font-medium">{ventaDetalle.vehiculoResumen.año}</p>
                        </div>
                      )}
                      {ventaDetalle.vehiculoResumen?.motor && (
                        <div>
                          <p className="text-sm text-gray-400">Motor</p>
                          <p className="font-medium">{ventaDetalle.vehiculoResumen.motor}</p>
                        </div>
                      )}
                      {ventaDetalle.vehiculoResumen?.chasis && (
                        <div>
                          <p className="text-sm text-gray-400">Chasis</p>
                          <p className="font-medium">{ventaDetalle.vehiculoResumen.chasis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección Transacción */}
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 text-white flex items-center gap-2">
                    <DollarSign className="text-green-500" size={20} />
                    Detalles de la transacción
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Monto total</p>
                      <p className="text-xl font-bold text-green-400">
                        ${Number(ventaDetalle.monto).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Fecha</p>
                      <p className="font-medium">
                        {dayjs(ventaDetalle.fechaObj).locale("es").format("DD/MM/YYYY")}
                      </p>
                    </div>
                    {ventaDetalle.pagos?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400">Métodos de pago</p>
                        <div className="space-y-1">
                          {ventaDetalle.pagos.map((pago, i) => (
                            <p key={i} className="font-medium">
                              {pago.metodo || "N/A"}: $
                              {Number(pago.monto).toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {ventaDetalle.vehiculoPartePago && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="font-medium mb-2 text-white flex items-center gap-2">
                        <KeyRound className="text-yellow-500" size={18} />
                        Vehículo como parte de pago
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Vehículo</p>
                          <p className="font-medium">
                            {ventaDetalle.vehiculoPartePago.marca} {ventaDetalle.vehiculoPartePago.modelo} ({ventaDetalle.vehiculoPartePago.patente})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Año</p>
                          <p className="font-medium">{ventaDetalle.vehiculoPartePago.año}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Monto</p>
                          <p className="font-medium text-yellow-400">
                            ${Number(ventaDetalle.vehiculoPartePago.monto).toLocaleString("es-AR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Recibido por</p>
                          <p className="font-medium">{ventaDetalle.vehiculoPartePago.recibidoPor || "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección Registro */}
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 text-white flex items-center gap-2">
                    <FilePlus className="text-indigo-500" size={20} />
                    Información de registro
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Creado por</p>
                      <p className="font-medium">{ventaDetalle.creadoPor || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Fecha creación</p>
                      <p className="font-medium">
                        {ventaDetalle.creadoEn
                          ? new Date(ventaDetalle.creadoEn.seconds * 1000).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Vendido por</p>
                      <p className="font-medium">{ventaDetalle.vendidoPor || "—"}</p>
                    </div>
                    {ventaDetalle.modificadoPor && (
                      <>
                        <div>
                          <p className="text-sm text-gray-400">Modificado por</p>
                          <p className="font-medium">{ventaDetalle.modificadoPor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Fecha modificación</p>
                          <p className="font-medium">
                            {ventaDetalle.modificadoEn
                              ? new Date(ventaDetalle.modificadoEn.seconds * 1000).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-800 p-4 border-t border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => exportarVentaPDF(ventaDetalle)}
                  className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Exportar PDF
                </button>
                <button
                  onClick={() => exportarBoletoDOCX(ventaDetalle)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Exportar Boleto
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}