import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc, Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import {
  FileText,
  LoaderCircle,
  KeyRound,
  IdCard,
  Car,
  ScanLine,
  GaugeCircle,
  Calendar,
  User,
  ShoppingCart,
  FilePlus,
  DollarSign,
  Calculator,
  Trash2,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import ExportToWordButton from "../components/presupuestos/ExportToWordButton";
import TooltipWrapper from "./Tooltip/TooltipWrapper";
import { useAuth } from '../contexts/AuthContext';

export default function ListaPresupuestos(props) {
  const { usuario } = useAuth();
  const [presupuestos, setPresupuestos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmarId, setConfirmarId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const getEstadoColor = (estado) => {
  switch (estado) {
    case "cerrado":
      return "bg-green-700 border-green-400";
    case "perdido":
      return "bg-red-700 border-red-400";
    case "abierto":
    default:
      return "bg-yellow-600 border-yellow-400";
  }
};

  // Modal detalle
  const [detalleId, setDetalleId] = useState(null);


  // Filtros y paginación
  const [filtroNombre, setFiltroNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 5;

useEffect(() => {
  const unsubscribe = collection(db, "presupuestos");
  
  const stop = onSnapshot(unsubscribe, async (snapshot) => {
    try {
      const presupuestosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Obtener clientes y vehículos una sola vez
      const [snapCli, snapVeh] = await Promise.all([
        getDocs(collection(db, "clientes")),
        getDocs(collection(db, "vehiculos")),
      ]);

      const listaClientes = snapCli.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const listaVehiculos = snapVeh.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClientes(listaClientes);
      setVehiculos(listaVehiculos);

      const enriquecidos = presupuestosData.map((p) => {
        const cliente = listaClientes.find((c) => c.id === p.clienteId);
        const vehiculo = listaVehiculos.find((v) => v.id === p.vehiculoId);
        const parte = p.parteDePago;

        return {
          ...p,
          clienteNombre: cliente?.nombre || "Cliente no encontrado",
          clienteApellido: cliente?.apellido || "",
          dniCliente: cliente?.dni || "",
          vehiculoInfo: vehiculo
            ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
            : "Vehículo no encontrado",
          patenteVehiculo: vehiculo?.patente || "-",
          estadoVehiculo: vehiculo?.estado || "-",
          tipoVehiculo: vehiculo?.tipo || "-",
          chasisVehiculo: vehiculo?.chasis || "-",
          motorVehiculo: vehiculo?.motor || "-",
          añoVehiculo: vehiculo?.año || "-",
          fechaObj: p.fecha?.toDate ? p.fecha.toDate() : new Date(),

          parteDePago: parte || null,
          parteDePagoInfo: parte
            ? `${parte.marca} ${parte.modelo} (${parte.patente})`
            : "—",
          parteDePagoPatente: parte?.patente || "-",
          parteDePagoMonto: parte?.monto || "-",
          parteDePagoRecibidoPor: parte?.recibidoPor || "-",
          parteDePagoAño: parte?.año || "-",
          parteDePagoTipo: parte?.tipo || "-",
          parteDePagoColor: parte?.color || "-",
          diferenciaMonto: p.monto - Number(p.parteDePago?.monto || 0),
        };
      });

      setPresupuestos(enriquecidos);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los datos");
    }
  });

  return () => stop();
}, []);



  const eliminarPresupuesto = async (id) => {
    try {
      await deleteDoc(doc(db, "presupuestos", id));
      toast.success("Presupuesto eliminado");
      setPresupuestos(presupuestos.filter((p) => p.id !== id));
      setConfirmarId(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar presupuesto");
    }
  };

  const actualizarEstado = async (id, nuevoEstado) => {
  try {
    const fechaCierre =
      nuevoEstado === "cerrado" || nuevoEstado === "perdido"
        ? Timestamp.now()
        : null;

    const modificadoPor = usuario?.nombre || "Desconocido";

    await updateDoc(doc(db, "presupuestos", id), {
      estado: nuevoEstado,
      fechaCierre,
      modificadoPor,
    });

    setPresupuestos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              estado: nuevoEstado,
              fechaCierre: fechaCierre ? fechaCierre.toDate() : null,
              modificadoPor,
            }
          : p
      )
    );

    toast.success("Estado actualizado");
  } catch (error) {
    console.error(error);
    toast.error("Error al actualizar estado");
  }
};

  const presupuestoDetalle = presupuestos.find((p) => p.id === detalleId);

  

  // Filtrado con búsqueda por múltiples campos y filtro de fecha
  const presupuestosFiltrados = useMemo(() => {
  const textoFiltro = filtroNombre.toLowerCase().trim();

  return presupuestos.filter((p) => {
    // Filtro de texto existente
    const textoCoincide =
      (p.clienteNombre?.toLowerCase() || "").includes(textoFiltro) ||
      (p.clienteApellido?.toLowerCase() || "").includes(textoFiltro) ||
      (p.dniCliente?.toString().toLowerCase() || "").includes(textoFiltro) ||
      (p.vehiculoInfo?.toLowerCase() || "").includes(textoFiltro) ||
      (p.patenteVehiculo?.toLowerCase() || "").includes(textoFiltro);

    if (!textoCoincide) return false;

    // Filtrar por fechas
    if (fechaInicio) {
      if (dayjs(p.fechaObj).isBefore(dayjs(fechaInicio), "day")) {
        return false;
      }
    }
    if (fechaFin) {
      if (dayjs(p.fechaObj).isAfter(dayjs(fechaFin), "day")) {
        return false;
      }
    }

    // **Filtro nuevo por estado**
    if (filtroEstado && filtroEstado !== "todos") {
      if (p.estado !== filtroEstado) return false;
    }

    return true;
  });
}, [presupuestos, filtroNombre, fechaInicio, fechaFin, filtroEstado]);

  // Paginación
  const totalPaginas = Math.ceil(
    presupuestosFiltrados.length / ITEMS_POR_PAGINA
  );
  const presupuestosPagina = presupuestosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  // Cambiar página
  const irAPagina = (num) => {
    if (num < 1 || num > totalPaginas) return;
    setPaginaActual(num);
  };

  return (
    <div className="pt-6 p-2 max-w-4xl mx-auto text-white">
      <Toaster position="top-right" />

      <div className="flex items-center gap-2 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <FileText size={28} className="text-yellow-400" />
          <h2 className="text-2xl font-semibold">Listado</h2>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, DNI, vehículo, patente..."
          value={filtroNombre}
          onChange={(e) => {
            setFiltroNombre(e.target.value);
            setPaginaActual(1); 
          }}
          className="p-2 rounded bg-slate-800 text-white"
        />
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => {
            setFechaInicio(e.target.value);
            setPaginaActual(1);
          }}
          className="p-2 rounded bg-slate-800 text-white"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => {
            setFechaFin(e.target.value);
            setPaginaActual(1);
          }}
          className="p-2 rounded bg-slate-800 text-white"
        />

              <select
  value={filtroEstado}
  onChange={(e) => {
    setFiltroEstado(e.target.value);
    setPaginaActual(1); // reset de página
  }}
  className="p-2 rounded bg-slate-800 text-white"
>
  <option value="todos">Todos los estados</option>
  <option value="abierto">Abierto</option>
  <option value="cerrado">Cerrado</option>
  <option value="perdido">Perdido</option>
</select>
      </div>



      {loading ? (
        <div className="text-center text-slate-400 py-10">
          <LoaderCircle className="animate-spin mx-auto" size={32} />
          Cargando presupuestos...
        </div>
      ) : presupuestosFiltrados.length === 0 ? (
        <p className="text-center text-slate-400">
          No hay presupuestos que coincidan con el filtro.
        </p>
      ) : (
        <>
          <div className="grid gap-4">
            <AnimatePresence>
              {presupuestosPagina.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-gradient-to-br from-slate-800 to-slate-700/70 backdrop-blur-sm border border-slate-600 p-4 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 space-y-4"
                >
                  {/* 🗓️ Fecha y Cliente */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-lg font-semibold text-indigo-300">
                      {p.fecha
                        ? new Date(p.fecha.seconds * 1000).toLocaleDateString(
                            "es-AR"
                          )
                        : "—"}{" "}
                      · {p.clienteNombre} {p.clienteApellido}
                    </h3>
                   <div className="flex items-center gap-2">
  <Calculator className="w-4 h-4 text-purple-400" />
  <span className="text-slate-300 font-medium">Diferencia:</span>
  <span
    className={`font-bold ${
      p.diferenciaMonto < 0 ? "text-yellow-400" : "text-lime-400"
    }`}
  >
    {p.diferenciaMonto.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    })}
  </span>
</div>

                  </div>

                  {/* 🚗 Vehículo de Agencia */}
                  {p.vehiculoId && (
                    <div className="border-t border-slate-600 pt-4">
                      <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                        Vehículo de la Agencia
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-cyan-400" />
                          <span className="text-slate-300">Modelo:</span>
                          <span className="font-semibold">
                            {" "}
                            {p.vehiculoInfo}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-yellow-400" />
                          <span className="text-slate-300">Patente:</span>
                          <span className="font-semibold">
                            {p.patenteVehiculo || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IdCard className="w-4 h-4 text-indigo-400" />
                          <span className="text-slate-300">Estado:</span>
                          <span className="font-semibold">
                            {p.estado || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-cyan-400" />
                          <span className="text-slate-300">Tipo:</span>
                          <span className="font-semibold">
                            {" "}
                            {p.tipo || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300">
                            Valor Tazado:{" "}
                            <span className="text-lime-400 font-semibold">
                              {p.monto?.toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS",
                                minimumFractionDigits: 0,
                              })}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ScanLine className="w-4 h-4 text-orange-400" />
                          <span className="text-slate-300">Chasis:</span>
                          <span className="font-semibold">
                            {" "}
                            {p.chasis || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GaugeCircle className="w-4 h-4 text-red-400" />
                          <span className="text-slate-300">Motor:</span>
                          <span className="font-semibold">
                            {" "}
                            {p.motor || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <Calendar className="w-4 h-4 text-pink-400" />
                          <span className="text-slate-300">Año:</span>
                          <span className="font-semibold"> {p.año || "-"}</span>
                        </div>
                        {p.pagos && p.pagos.length > 0 && (
  <div className="text-sm mt-1">
    <strong>Pagos:</strong>
    <ul className="list-disc list-inside">
      {p.pagos.map((p, index) => (
        <li key={index}>
          {p.metodo}: ${Number(p.monto).toLocaleString("es-UY", { minimumFractionDigits: 2 })}
        </li>
      ))}
    </ul>
  </div>
)}
                      </div>
                    </div>
                  )}

                  {/* 🚙 Parte de pago */}
                  {p.parteDePago && (
                    <div className="border-t border-slate-600 pt-4">
                      <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                        Vehículo que entrega el cliente
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-cyan-400" />
                          <span className="text-slate-300">Modelo:</span>
                          <span className="font-semibold">
                            {" "}
                            {p.parteDePagoInfo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-pink-400" />
                          <span className="text-slate-300">Año:</span>
                          <span className="font-semibold">
                            {" "}
                            {p.parteDePagoAño}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-yellow-400" />
                          <span className="text-slate-300">Patente:</span>
                          <span className="font-semibold">
                            {" "}
                            {p.parteDePagoPatente}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span>
                            Valor Tazado:{" "}
                            <span className="text-lime-400 font-semibold">
                              {Number(p.parteDePagoMonto).toLocaleString(
                                "es-AR",
                                {
                                  style: "currency",
                                  currency: "ARS",
                                  minimumFractionDigits: 0,
                                }
                              )}
                            </span>
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-300">
                            Recibido/Tazado Por:
                          </span>
                          <span className="font-semibold">
                            {" "}
                            {p.parteDePagoRecibidoPor}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 📃 Datos de gestión */}
                  <div className="border-t border-slate-600 pt-4">
                    <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                      Datos de la Compra/Venta
                    </h4>
                    <div className="space-y-2 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="text-green-500" size={16} />
                        <span>
                          <strong>Tazado por:</strong>{" "}
                          {p.parteDePago?.recibidoPor || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FilePlus className="text-indigo-500" size={16} />
                        <span>
                          <strong>Creado por:</strong> {p.creadoPor || "—"} ·{" "}
                          {p.fecha
                            ? new Date(
                                p.fecha.seconds * 1000
                              ).toLocaleDateString("es-AR")
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {/* ▶️ Estado del presupuesto */}
<div className="flex items-center gap-3 mt-4">
  <span className="text-sm text-slate-300">Estado:</span>

 <select
  value={p.estado || "abierto"}
  onChange={(e) => actualizarEstado(p.id, e.target.value)}
  className={`border-2 text-white rounded px-2 py-1 text-sm ${getEstadoColor(p.estado || "abierto")}`}
>
    <option value="abierto">Abierto</option>
    <option value="cerrado">Cerrado</option>
    <option value="perdido">Perdido</option>
  </select>

  {p.fechaCierre && (
  <span className="text-xs text-slate-400">
    · Cierre: {dayjs(p.fechaCierre).locale("es").format("DD/MM/YYYY")} · Mod:{" "}
    {p.modificadoPor || "—"}
  </span>
)}
</div>

                    {/* ⚙️ Acciones */}
                    <div className="flex justify-end gap-4 mt-4 text-lg">
                      <TooltipWrapper label="Descargar en Word">
                        <ExportToWordButton presupuesto={p} />
                      </TooltipWrapper>

                      <TooltipWrapper label="Eliminar vehículo">
                        <button
                          onClick={() => eliminarPresupuesto(p.vehiculoId)}
                          className="text-red-400 hover:text-red-600"
                          title="Eliminar vehículo"
                        >
                          <Trash2 />
                        </button>
                      </TooltipWrapper>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Paginación */}
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => irAPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50"
            >
              Anterior
            </button>
            {[...Array(totalPaginas)].map((_, i) => (
              <button
                key={i}
                onClick={() => irAPagina(i + 1)}
                className={`px-3 py-1 rounded ${
                  paginaActual === i + 1
                    ? "bg-yellow-400 text-black"
                    : "bg-slate-800"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => irAPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* Confirmar eliminar */}
      <AnimatePresence>
        {confirmarId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          >
            <div className="bg-slate-900 p-6 rounded max-w-sm w-full text-center">
              <p className="mb-4">
                ¿Seguro que quieres eliminar este presupuesto?
              </p>
              <div className="flex justify-around gap-4">
                <button
                  onClick={() => eliminarPresupuesto(confirmarId)}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmarId(null)}
                  className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
