/* import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  DollarSign,
  User,
  Check,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import ModalPago from "./ModalPago";

const convertirFecha = (fecha) => {
  if (!fecha) return null;
  
  try {
    if (fecha instanceof Date && !isNaN(fecha)) return fecha;
    if (fecha?.toDate) return fecha.toDate();
    
    const date = new Date(fecha);
    if (!isNaN(date)) return date;
    
    if (typeof fecha === 'string' && fecha.includes('/')) {
      const [day, month, year] = fecha.split('/');
      return new Date(year, month - 1, day);
    }
    
    return null;
  } catch (error) {
    console.error("Error convirtiendo fecha:", error);
    return null;
  }
};

export default function ListaDeudas() {
  const [deudas, setDeudas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [deudaExpandida, setDeudaExpandida] = useState(null);
  const { currentUser } = useAuth();
  const [modalPago, setModalPago] = useState({
    abierto: false,
    deuda: null,
    itemDeuda: null,
    index: null,
  });

  // Cargar deudas en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "deudas"), (snapshot) => {
      const deudasData = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Procesar cada deuda individual
       const deudasProcesadas = (data.deudas || []).map((d, i) => ({
  id: d.id || `deuda_${i}_${Date.now()}`,
  ...d,
  fechaVencimiento: convertirFecha(d.fechaVencimiento),
  fechaPago: convertirFecha(d.fechaPago),
  monto: typeof d.monto === "number" ? d.monto : Number(d.monto) || 0,
  pagado: !!d.pagado,
}));


        // Calcular montos
        const montoPendiente = deudasProcesadas
          .filter((d) => !d.pagado)
          .reduce((sum, d) => sum + d.monto, 0);

        return {
          id: doc.id,
          ...data,
          fechaVenta: convertirFecha(data.fechaVenta),
          fechaCreacion: convertirFecha(data.fechaCreacion),
          deudas: deudasProcesadas,
          montoPendiente,
          fechaVencimientoProxima: deudasProcesadas
            .filter((d) => !d.pagado && d.fechaVencimiento)
            .reduce((min, d) => (!min || d.fechaVencimiento < min ? d.fechaVencimiento : min), null),
          estado: montoPendiente === 0 ? "Pagado" : data.estado || "Pendiente",
        };
      });

      setDeudas(deudasData);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  const registrarEnCajaDiaria = async (deuda, pagoData) => {
    try {
      const registroCaja = {
        descripcion: `Pago de deuda - ${deuda.clienteNombre || 'Cliente no especificado'}`,
        monto: Number(pagoData.monto),
        tipo: "ingreso",
        fecha: Timestamp.now(),
        relacionadoCon: `deuda:${deuda.id}`,
        ventaId: deuda.ventaId || null,
        clienteId: deuda.clienteId || null,
        vehiculoId: deuda.vehiculoId || null,
        metodoPago: pagoData.metodo || "Efectivo",
        createdAt: Timestamp.now(),
        creadoPor: currentUser?.email || "Sistema",
        esPagoDeDeuda: true,
        observaciones: pagoData.observaciones || "",
      };

      const docRef = await addDoc(collection(db, "caja_diaria"), registroCaja);
      return docRef.id;
    } catch (error) {
      console.error("Error registrando en caja diaria:", error);
      throw error;
    }
  };

  const abrirModalPago = (deuda, itemDeuda, index) => {
    setModalPago({
      abierto: true,
      deuda,
      itemDeuda,
      index,
    });
  };

  const cerrarModalPago = () => {
    setModalPago({
      abierto: false,
      deuda: null,
      itemDeuda: null,
      index: null,
    });
  };

  const procesarPago = async (deudaId, itemIndex, pagoData) => {
    try {
      const deuda = deudas.find((d) => d.id === deudaId);
      if (!deuda) {
        toast.error("Deuda no encontrada");
        return;
      }

      const itemOriginal = deuda.deudas[itemIndex];
      const montoPagado = Number(pagoData.montoPagado) || 0;
      const montoOriginal = Number(itemOriginal.monto) || 0;
      const interes = Number(pagoData.interes) || 0;

      // Determinar tipo de pago
      const esPagoTotal = Math.abs(montoPagado - montoOriginal) < 0.01 || montoPagado >= montoOriginal;
      const esPagoParcial = !esPagoTotal;

      // Registrar en caja diaria
      const cajaId = await registrarEnCajaDiaria(deuda, {
        metodo: pagoData.metodoPago || itemOriginal.metodo || "Efectivo",
        monto: montoPagado,
        observaciones: pagoData.observaciones || "",
      });

      // Crear copia de las deudas para actualizar
      const nuevosMetodosPago = deuda.deudas.map(item => ({...item}));

      if (esPagoTotal) {
        // Pago completo - marcar como pagado
        nuevosMetodosPago[itemIndex] = {
          ...itemOriginal,
          pagado: true,
          fechaPago: Timestamp.now(),
          metodo: pagoData.metodoPago || itemOriginal.metodo,
          observaciones: `Pago completo ${pagoData.observaciones || ''}`.trim(),
          relacionCaja: cajaId
        };
      } else {
        nuevosMetodosPago[itemIndex] = {
  ...itemOriginal,
  pagado: true,
  fechaPago: Timestamp.now(),
  metodo: pagoData.metodoPago || itemOriginal.metodo,
  observaciones: `Pago parcial de $${montoPagado}`,
  relacionCaja: cajaId,
  esPagoParcial: true
};

// Crear nueva deuda con saldo restante
const nuevoSaldo = (montoOriginal - montoPagado) * (1 + interes / 100);

nuevosMetodosPago.push({
  id: `deuda_saldo_${Date.now()}`,
  monto: nuevoSaldo,
  pagado: false,
  fechaVencimiento: pagoData.nuevaFechaVencimiento
    ? Timestamp.fromDate(new Date(pagoData.nuevaFechaVencimiento))
    : itemOriginal.fechaVencimiento,
  metodo: itemOriginal.metodo,
  observaciones: `Saldo restante de pago parcial`,
});
      }

      // Calcular nuevo estado
      const montoPendiente = nuevosMetodosPago
        .filter(d => !d.pagado)
        .reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

      const updateData = {
        deudas: nuevosMetodosPago,
       estado: montoPendiente === 0 
  ? "Pagado" 
  : montoPendiente < montoOriginal 
    ? "Parcialmente Pagado" 
    : "Pendiente",

        montoPendiente,
        ultimaActualizacion: Timestamp.now(),
        ...(montoPendiente === 0 && { fechaPago: Timestamp.now() })
      };

      // Actualizar en Firestore
      await updateDoc(doc(db, "deudas", deudaId), updateData);

      // Actualizar estado local
      setDeudas(prev => prev.map(d => {
        if (d.id !== deudaId) return d;
        
        const fechaVencimientoProxima = montoPendiente > 0 ?
          nuevosMetodosPago
            .filter(d => !d.pagado && d.fechaVencimiento)
            .reduce((min, d) => {
              const fecha = d.fechaVencimiento?.toDate?.() || d.fechaVencimiento;
              return (!min || fecha < min) ? fecha : min;
            }, null) :
          null;

        return {
          ...d,
          ...updateData,
          fechaVencimientoProxima
        };
      }));

      toast.success(
        esPagoTotal ?
          `✅ Pago completo registrado ($${montoPagado.toFixed(2)})` :
          `✅ Pago parcial registrado. Nuevo saldo: $${(montoOriginal - montoPagado).toFixed(2)}`
      );

      cerrarModalPago();
    } catch (error) {
      console.error("Error en procesarPago:", error);
      toast.error(`Error al procesar pago: ${error.message}`);
    }
  };

  const toggleExpandirDeuda = (deudaId) => {
    setDeudaExpandida(deudaExpandida === deudaId ? null : deudaId);
  };

  // Filtrar y ordenar deudas
  const deudasFiltradas = deudas
    .filter((deuda) => {
      const coincideBusqueda =
        deuda.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        deuda.vehiculoInfo?.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
        deuda.vehiculoInfo?.modelo?.toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "pendientes" && deuda.estado !== "Pagado") ||
        (filtroEstado === "pagadas" && deuda.estado === "Pagado");

      return coincideBusqueda && coincideEstado;
    })
    .sort((a, b) => {
      if (a.fechaVencimientoProxima && b.fechaVencimientoProxima) {
        return a.fechaVencimientoProxima - b.fechaVencimientoProxima;
      }
      if (a.fechaVencimientoProxima) return -1;
      if (b.fechaVencimientoProxima) return 1;
      return 0;
    });

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }



  return (
    <div className="p-6 pt-20 min-h-screen bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="text-blue-400" /> Gestión de Deudas
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente o vehículo..."
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="text-gray-400" size={18} />
              </div>
              <select
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="pendientes">Pendientes</option>
                <option value="pagadas">Pagadas</option>
              </select>
            </div>
          </div>
        </div>

        {deudasFiltradas.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">No se encontraron deudas</p>
            {busqueda || filtroEstado !== "todos" ? (
              <button
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstado("todos");
                }}
                className="mt-4 text-blue-400 hover:text-blue-300"
              >
                Limpiar filtros
              </button>
            ) : (
              <p className="text-gray-500 mt-2">No hay deudas registradas</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {deudasFiltradas.map((deuda) => (
              <div
                key={deuda.id}
                className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-200 ${
                  deudaExpandida === deuda.id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-750 transition-colors duration-150"
                  onClick={() => toggleExpandirDeuda(deuda.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold flex items-center gap-2">
                        <User size={18} className="text-blue-400" />
                        <span className="truncate max-w-xs">
                          {deuda.clienteNombre}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Vehículo: {deuda.vehiculoInfo?.marca}{" "}
                        {deuda.vehiculoInfo?.modelo}
                      </p>
                      <p className="text-sm text-gray-400">
                        Fecha venta:{" "}
                        {deuda.fechaVenta?.toLocaleDateString() || "N/A"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end ml-4">
                      <NumericFormat
                        value={deuda.montoPendiente}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$ "
                        className={`text-lg font-bold ${
                          deuda.montoPendiente > 0
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      />
                      <span
                        className={`text-xs px-2 py-1 rounded-full mt-1 ${
                          deuda.estado === "Pagado"
                            ? "bg-green-900 text-green-300"
                            : deuda.estado === "Parcialmente Pagado"
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {deuda.estado}
                      </span>
                    </div>

                    <div className="ml-4 flex items-center">
                      {deudaExpandida === deuda.id ? (
                        <ChevronUp className="text-gray-400" />
                      ) : (
                        <ChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {deudaExpandida === deuda.id && (
                  <div className="border-t border-gray-700 p-4">
                    <div className="mb-6">
                      <h4 className="font-medium mb-3 text-blue-400 flex items-center gap-2">
                        <Clock size={16} /> Pagos pendientes
                      </h4>
                      {deuda.deudas.filter((d) => !d.pagado).length === 0 ? (
                        <div className="bg-gray-750 rounded p-3 text-center text-gray-400">
                          No hay pagos pendientes
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {deuda.deudas
                            .filter((d) => !d.pagado)
                            .map((item, idx) => {
                              const fechaVencimiento = convertirFecha(
                                item.fechaVencimiento
                              );
                              return (
                                <li
                                  key={idx}
                                  className="bg-gray-750 rounded-lg p-3"
                                >
                                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-100">
                                        {item.metodo ||
                                          "Método no especificado"}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                        <Calendar size={14} />
                                        {fechaVencimiento
                                          ? fechaVencimiento.toLocaleDateString(
                                              "es-AR"
                                            )
                                          : "Sin fecha de vencimiento"}
                                      </div>
                                      {fechaVencimiento &&
                                        fechaVencimiento < new Date() && (
                                          <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                                            <AlertTriangle size={14} />
                                            ¡Vencido!
                                          </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <NumericFormat
                                       value={item.pagado ? 0 : item.monto}
                                        displayType="text"
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        decimalScale={2}
                                        fixedDecimalScale
                                        prefix="$ "
                                        className={`font-semibold ${
                                          fechaVencimiento &&
                                          fechaVencimiento < new Date()
                                            ? "text-red-400"
                                            : "text-gray-100"
                                        }`}
                                      />
                                      <button
  onClick={() => abrirModalPago(deuda, item, idx)}
  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
>
  <Check size={16} />
  Pagar
</button>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-green-400 flex items-center gap-2">
                        <Check size={16} /> Pagos realizados
                      </h4>
                      {deuda.deudas.filter((d) => d.pagado).length === 0 ? (
                        <div className="bg-gray-750 rounded p-3 text-center text-gray-400">
                          No hay pagos registrados
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {deuda.deudas
                            .filter((d) => d.pagado)
                            .map((item, idx) => {
                              const fechaPago = convertirFecha(item.fechaPago);
                              return (
                                <li
                                  key={idx}
                                  className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
                                >
                                  <div>
                                    <span className="text-gray-100">
                                      {item.metodo || "Método no especificado"}
                                    </span>
                                    {fechaPago && (
                                      <div className="text-xs text-gray-500">
                                        Pagado el:{" "}
                                        {fechaPago.toLocaleDateString("es-AR")}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <NumericFormat
                                      value={item.monto}
                                      displayType="text"
                                      thousandSeparator="."
                                      decimalSeparator=","
                                      decimalScale={2}
                                      fixedDecimalScale
                                      prefix="$ "
                                      className="text-green-400"
                                    />
                                    <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                                      Pagado
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
       {modalPago.abierto && (
      <ModalPago
        deuda={modalPago.deuda}
        itemDeuda={modalPago.itemDeuda}
        index={modalPago.index}
        onClose={cerrarModalPago}
        onConfirm={procesarPago}
      />
    )}
    </div>
  );
}
 */


import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  updateDoc,
  Timestamp,
  onSnapshot,
  addDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import {
  BadgeDollarSign,
  Clock,
  Check,
  Filter,
  Search,
  Calendar,
  Percent,
  ChevronDown,
  ChevronUp,
  User,
  DollarSign,
  FileText,
  CreditCard,
  Receipt,
  Banknote,
  MoreVertical,
  X,
  AlertCircle,
  Info,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import Spinner from "../components/Spinner/Spinner";
import ModalPago from "../components/Deudas/ModalPago";

export default function ListaDeudas() {
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeuda, setSelectedDeuda] = useState(null);
  const [selectedCuotaId, setSelectedCuotaId] = useState(null);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [filtro, setFiltro] = useState({
    texto: "",
    estado: "todos",
    fechaDesde: "",
    fechaHasta: "",
    montoMinimo: "",
    montoMaximo: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  const parseFechaLocal = (fechaStr) => {
    const [year, month, day] = fechaStr.split("-");
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    const q = collection(db, "deudas");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const deudasData = [];
      querySnapshot.forEach((doc) => {
        const deuda = { id: doc.id, ...doc.data() };
        if (deuda.deudas) {
          deuda.deudas = deuda.deudas.map((cuota, index) => ({
            ...cuota,
            id: cuota.id || `cuota-${index}-${doc.id}`,
            pagos: cuota.pagos || []
          }));
        }
        deudasData.push(deuda);
      });
      setDeudas(deudasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const calcularTotalPagado = (deuda) => {
    if (!deuda.deudas) return 0;
    return deuda.deudas.reduce((sum, cuota) => {
      const pagos = cuota.pagos || [];
      return sum + pagos.reduce((subSum, p) => subSum + (p.monto || 0), 0);
    }, 0);
  };

  const handleRegistrarPago = (deuda, cuotaId) => {
    setSelectedDeuda(deuda);
    setSelectedCuotaId(cuotaId);
    setPagoModalOpen(true);
  };

  const handleConfirmarPago = async (pagoData) => {
    try {
      const { metodoPago, montoPagado, interes, observaciones } = pagoData;
      const montoIntereses = montoPagado * (interes / 100);
      const totalPago = montoPagado + montoIntereses;

      const deudaRef = doc(db, "deudas", selectedDeuda.id);
      const cuotasActualizadas = selectedDeuda.deudas.map((cuota) => {
        if (cuota.id === selectedCuotaId) {
          const pagosActuales = cuota.pagos || [];
          const totalPagado = pagosActuales.reduce((sum, p) => sum + (p.monto || 0), 0);
          const nuevoPago = {
            monto: montoPagado,
            fecha: Timestamp.now(),
            metodoPago,
            observaciones,
            montoCapital: montoPagado,
            montoIntereses,
            registradoEn: Timestamp.now()
          };

          const nuevoTotalPagado = totalPagado + montoPagado;
          const nuevaDeudaRestante = cuota.monto - totalPagado - montoPagado + montoIntereses;
          const nuevoMonto = nuevaDeudaRestante > 0 ? nuevoTotalPagado + nuevaDeudaRestante : nuevoTotalPagado;
          const cuotaPagada = nuevoTotalPagado >= cuota.monto;

          return {
            ...cuota,
            pagos: [...pagosActuales, nuevoPago],
            pagado: cuotaPagada,
            fechaUltimoPago: Timestamp.now(),
            monto: cuota.monto + montoIntereses,
            fechaVencimiento: pagoData.nuevaFechaVencimiento && typeof pagoData.nuevaFechaVencimiento === "string"
              ? Timestamp.fromDate(parseFechaLocal(pagoData.nuevaFechaVencimiento))
              : cuota.fechaVencimiento
          };
        }
        return cuota;
      });

      const updateData = { deudas: cuotasActualizadas };

      await addDoc(collection(db, "caja_diaria"), {
        clienteId: selectedDeuda.clienteId,
        creadoPor: "Sistema",
        createdAt: Timestamp.now(),
        descripcion: `Pago cuota deuda - ${selectedDeuda.clienteNombre} (${metodoPago})`,
        esPagoDeDeuda: true,
        fecha: Timestamp.now(),
        metodoPago,
        monto: totalPago,
        observaciones,
        relacionadoCon: `deuda:${selectedDeuda.id}`,
        tipo: "ingreso",
        vehiculoId: selectedDeuda.vehiculoId,
        ventaId: selectedDeuda.ventaId
      });

      await updateDoc(deudaRef, updateData);

      toast.success("Pago registrado con éxito");
      setPagoModalOpen(false);
    } catch (error) {
      console.error("Error registrando pago:", error);
      toast.error("Error al registrar el pago");
    }
  };

  const formatFecha = (timestamp) => {
    if (timestamp?.toDate) return timestamp.toDate().toLocaleDateString("es-AR");
    if (timestamp instanceof Date) return timestamp.toLocaleDateString("es-AR");
    if (typeof timestamp === "string") {
      try {
        return new Date(timestamp).toLocaleDateString("es-AR");
      } catch {
        return "Fecha inválida";
      }
    }
    return "No especificada";
  };

  const deudasFiltradas = deudas.filter((deuda) => {
    const textoBusqueda = filtro.texto.toLowerCase();
    const cumpleTexto =
      !filtro.texto ||
      deuda.clienteNombre.toLowerCase().includes(textoBusqueda) ||
      deuda.vehiculoInfo?.marca?.toLowerCase().includes(textoBusqueda) ||
      deuda.vehiculoInfo?.modelo?.toLowerCase().includes(textoBusqueda) ||
      deuda.vehiculoInfo?.patente?.toLowerCase().includes(textoBusqueda);

    const totalPagado = calcularTotalPagado(deuda);
    const montoTotal = deuda.montoTotal || 0;
    let cumpleEstado = true;
    if (filtro.estado === "pendientes") {
      cumpleEstado = totalPagado === 0;
    } else if (filtro.estado === "parciales") {
      cumpleEstado = totalPagado > 0 && totalPagado < montoTotal;
    } else if (filtro.estado === "pagados") {
      cumpleEstado = totalPagado >= montoTotal;
    }

    const fechaVenta = deuda.fechaVenta?.toDate?.() || new Date();
    const cumpleFechaDesde = !filtro.fechaDesde || fechaVenta >= new Date(filtro.fechaDesde);
    const cumpleFechaHasta = !filtro.fechaHasta || fechaVenta <= new Date(filtro.fechaHasta + 'T23:59:59');
    
    const saldoPendiente = montoTotal - totalPagado;
    const cumpleMontoMinimo = !filtro.montoMinimo || saldoPendiente >= Number(filtro.montoMinimo);
    const cumpleMontoMaximo = !filtro.montoMaximo || saldoPendiente <= Number(filtro.montoMaximo);

    return cumpleTexto && cumpleEstado && cumpleFechaDesde && cumpleFechaHasta && cumpleMontoMinimo && cumpleMontoMaximo;
  });

  const deudasPendientes = deudasFiltradas.filter((deuda) => calcularTotalPagado(deuda) === 0);
  const deudasParciales = deudasFiltradas.filter((deuda) => {
    const totalPagado = calcularTotalPagado(deuda);
    const montoTotal = deuda.montoTotal || 0;
    return totalPagado > 0 && totalPagado < montoTotal;
  });
  const deudasPagadas = deudasFiltradas.filter((deuda) => calcularTotalPagado(deuda) >= (deuda.montoTotal || 0));

  const resetFilters = () => {
    setFiltro({
      texto: "",
      estado: "todos",
      fechaDesde: "",
      fechaHasta: "",
      montoMinimo: "",
      montoMaximo: ""
    });
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gray-900 text-gray-200 w-full max-w-6xl mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="text-indigo-400" size={28} />
            Gestión de Deudores
          </h2>
          <p className="text-gray-400 mt-1">Administra los pagos pendientes de tus clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-300 flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg shadow-sm border border-gray-700">
            <Filter size={16} />
            <span>{deudasFiltradas.length} de {deudas.length} deudas</span>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-lg shadow-sm border border-gray-700 transition"
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
            <span>{showFilters ? "Ocultar" : "Filtros"}</span>
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-6 bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-500" size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar cliente, vehículo o patente..."
                  className="pl-10 w-full p-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={filtro.texto}
                  onChange={(e) => setFiltro({...filtro, texto: e.target.value})}
                />
              </div>
              
              <select
                className="w-full p-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filtro.estado}
                onChange={(e) => setFiltro({...filtro, estado: e.target.value})}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendientes">Pendientes</option>
                <option value="parciales">Parciales</option>
                <option value="pagados">Pagados</option>
              </select>
              
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600 flex-1">
                  <Calendar className="text-gray-500" size={18} />
                  <input
                    type="date"
                    value={filtro.fechaDesde}
                    onChange={(e) => setFiltro({...filtro, fechaDesde: e.target.value})}
                    className="bg-transparent text-gray-200 flex-1 focus:outline-none text-sm min-w-0"
                    placeholder="Desde"
                  />
                </div>
                
                <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600 flex-1">
                  <Calendar className="text-gray-500" size={18} />
                  <input
                    type="date"
                    value={filtro.fechaHasta}
                    onChange={(e) => setFiltro({...filtro, fechaHasta: e.target.value})}
                    className="bg-transparent text-gray-200 flex-1 focus:outline-none text-sm min-w-0"
                    placeholder="Hasta"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600">
                <DollarSign className="text-gray-500" size={18} />
                <input
                  type="number"
                  placeholder="Monto mínimo"
                  value={filtro.montoMinimo}
                  onChange={(e) => setFiltro({...filtro, montoMinimo: e.target.value})}
                  className="bg-transparent text-gray-200 flex-1 focus:outline-none text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg border border-gray-600">
                <DollarSign className="text-gray-500" size={18} />
                <input
                  type="number"
                  placeholder="Monto máximo"
                  value={filtro.montoMaximo}
                  onChange={(e) => setFiltro({...filtro, montoMaximo: e.target.value})}
                  className="bg-transparent text-gray-200 flex-1 focus:outline-none text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={resetFilters}
                  className="text-gray-400 hover:text-gray-200 hover:bg-gray-700 px-3 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={50} color="text-indigo-400" />
        </div>
      ) : deudasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-xl shadow-sm border border-gray-700">
          <div className="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Info className="text-indigo-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No se encontraron deudas</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {filtro.texto || filtro.estado !== "todos" || filtro.fechaDesde || filtro.fechaHasta 
              ? "No hay deudas que coincidan con los filtros aplicados." 
              : "No hay deudas registradas en el sistema."}
          </p>
          {(filtro.texto || filtro.estado !== "todos" || filtro.fechaDesde || filtro.fechaHasta) && (
            <button
              onClick={resetFilters}
              className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mx-auto"
            >
              <X size={16} />
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumen rápido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400">Total pendiente</h3>
                <div className="bg-red-900/30 text-red-400 p-1 rounded-full">
                  <AlertCircle size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                <NumericFormat 
                  value={deudasPendientes.reduce((sum, d) => sum + (d.montoTotal || 0), 0)} 
                  displayType={'text'} 
                  thousandSeparator="." 
                  decimalSeparator="," 
                  prefix="$" 
                  decimalScale={2} 
                  fixedDecimalScale
                />
              </p>
              <p className="text-sm text-gray-400 mt-1">{deudasPendientes.length} clientes</p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400">Pagos parciales</h3>
                <div className="bg-yellow-900/30 text-yellow-400 p-1 rounded-full">
                  <Clock size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                <NumericFormat 
                  value={deudasParciales.reduce((sum, d) => sum + (d.montoTotal || 0) - calcularTotalPagado(d), 0)} 
                  displayType={'text'} 
                  thousandSeparator="." 
                  decimalSeparator="," 
                  prefix="$" 
                  decimalScale={2} 
                  fixedDecimalScale
                />
              </p>
              <p className="text-sm text-gray-400 mt-1">{deudasParciales.length} clientes</p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400">Total pagado</h3>
                <div className="bg-green-900/30 text-green-400 p-1 rounded-full">
                  <Check size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                <NumericFormat 
                  value={deudasPagadas.reduce((sum, d) => sum + calcularTotalPagado(d), 0)} 
                  displayType={'text'} 
                  thousandSeparator="." 
                  decimalSeparator="," 
                  prefix="$" 
                  decimalScale={2} 
                  fixedDecimalScale
                />
              </p>
              <p className="text-sm text-gray-400 mt-1">{deudasPagadas.length} clientes</p>
            </div>
          </div>

          {/* Listado de deudas */}
          {deudasPendientes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <Clock size={20} /> Pendientes
                </h3>
                <span className="bg-red-900/30 text-red-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {deudasPendientes.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {deudasPendientes.map((deuda) => (
                  <DeudaItem 
                    key={deuda.id} 
                    deuda={deuda} 
                    onRegistrarPago={handleRegistrarPago} 
                    formatFecha={formatFecha}
                  />
                ))}
              </div>
            </div>
          )}

          {deudasParciales.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                  <Percent size={20} /> Parciales
                </h3>
                <span className="bg-yellow-900/30 text-yellow-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {deudasParciales.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {deudasParciales.map((deuda) => (
                  <DeudaItem 
                    key={deuda.id} 
                    deuda={deuda} 
                    onRegistrarPago={handleRegistrarPago} 
                    formatFecha={formatFecha}
                  />
                ))}
              </div>
            </div>
          )}

          {deudasPagadas.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <Check size={20} /> Pagadas
                </h3>
                <span className="bg-green-900/30 text-green-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {deudasPagadas.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {deudasPagadas.map((deuda) => (
                  <DeudaItem 
                    key={deuda.id} 
                    deuda={deuda} 
                    onRegistrarPago={handleRegistrarPago} 
                    formatFecha={formatFecha}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {pagoModalOpen && selectedDeuda && (
          <ModalPago
            deuda={selectedDeuda}
            cuotaId={selectedCuotaId}
            onClose={() => setPagoModalOpen(false)}
            onConfirm={handleConfirmarPago}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DeudaItem({ deuda, onRegistrarPago, formatFecha }) {
  const [expandido, setExpandido] = useState(false);
  const [mostrarCuotas, setMostrarCuotas] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarAcciones, setMostrarAcciones] = useState(false);

  const calcularTotalPagado = (deuda) => {
    if (!deuda.deudas) return 0;
    return deuda.deudas.reduce((sum, cuota) => {
      const pagos = cuota.pagos || [];
      return sum + pagos.reduce((subSum, p) => subSum + (p.monto || 0), 0);
    }, 0);
  };

  const calcularSaldoPendiente = (deuda) => {
    if (!deuda.deudas) return 0;
    const saldo = deuda.deudas.reduce((total, cuota) => {
      const montoConInteres = cuota.monto || 0;
      const totalPagadoCuota = (cuota.pagos || []).reduce((sum, pago) => sum + (pago.monto || 0), 0);
      return total + (montoConInteres - totalPagadoCuota);
    }, 0);
    return saldo;
  };

  const calcularSaldoCuota = (cuota) => {
    if (cuota.pagado) return 0;
    const pagosCuota = (cuota.pagos || []).reduce((sum, pago) => sum + pago.monto, 0);
    return cuota.monto - pagosCuota;
  };

  const totalPagado = calcularTotalPagado(deuda);
  const saldoPendiente = calcularSaldoPendiente(deuda);
  const porcentajePagado = Math.round((totalPagado / deuda.montoTotal) * 100);
  const estadoDeuda = saldoPendiente === 0 ? 'pagada' : totalPagado > 0 ? 'parcial' : 'pendiente';

  // Obtener la próxima cuota a vencer
  const proximaCuota = deuda.deudas?.reduce((proxima, cuota) => {
    if (cuota.pagado) return proxima;
    
    const fechaVencimiento = cuota.fechaVencimiento?.toDate?.() || new Date();
    if (!proxima) return cuota;
    
    const proximaFecha = proxima.fechaVencimiento?.toDate?.() || new Date();
    return fechaVencimiento < proximaFecha ? cuota : proxima;
  }, null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden hover:shadow-md transition"
    >
      <div 
        className="p-4 flex items-start justify-between cursor-pointer hover:bg-gray-700/50 transition"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              estadoDeuda === 'pagada' ? 'bg-green-500' : 
              estadoDeuda === 'parcial' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <div className="min-w-0">
              <h3 className="font-bold text-white truncate">
                {deuda.clienteNombre}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {deuda.vehiculoInfo?.marca} {deuda.vehiculoInfo?.modelo} - {deuda.vehiculoInfo?.patente}
              </p>
            </div>
          </div>
          
          {proximaCuota && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs ${
                estadoDeuda === 'pagada' ? 'bg-green-900/50 text-green-400' : 
                estadoDeuda === 'parcial' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'
              }`}>
                {estadoDeuda === 'pagada' ? 'Pagada' : estadoDeuda === 'parcial' ? 'Parcial' : 'Pendiente'}
              </span>
              <span className="text-gray-400">
                {proximaCuota.metodo || "Cuota"} vence {formatFecha(proximaCuota.fechaVencimiento)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 ml-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Saldo</div>
            <div className={`text-lg font-bold ${
              saldoPendiente > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              <NumericFormat 
                value={saldoPendiente} 
                displayType={'text'} 
                thousandSeparator="." 
                decimalSeparator="," 
                prefix="$" 
                decimalScale={2} 
                fixedDecimalScale
              />
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setMostrarAcciones(!mostrarAcciones);
              }}
              className="text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-gray-700 transition"
            >
              <MoreVertical size={20} />
            </button>
            
            {mostrarAcciones && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegistrarPago(deuda);
                      setMostrarAcciones(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <DollarSign size={16} />
                    Registrar pago
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Función para generar recibo (a implementar)
                      setMostrarAcciones(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <FileText size={16} />
                    Generar recibo
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {expandido ? (
            <ChevronUp className="text-gray-500" size={20} />
          ) : (
            <ChevronDown className="text-gray-500" size={20} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-700">
              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-300">
                    Progreso de pago ({porcentajePagado}%)
                  </span>
                  <span className="text-sm text-gray-400">
                    <NumericFormat 
                      value={totalPagado} 
                      displayType={'text'} 
                      thousandSeparator="." 
                      decimalSeparator="," 
                      prefix="$" 
                      decimalScale={2} 
                      fixedDecimalScale
                    /> / 
                    <NumericFormat 
                      value={deuda.montoTotal} 
                      displayType={'text'} 
                      thousandSeparator="." 
                      decimalSeparator="," 
                      prefix="$" 
                      decimalScale={2} 
                      fixedDecimalScale
                    />
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      estadoDeuda === 'pagada' ? 'bg-green-500' : 
                      estadoDeuda === 'parcial' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${porcentajePagado}%` }}
                  ></div>
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-400">Total deuda</div>
                  <div className="text-lg font-semibold text-white">
                    <NumericFormat 
                      value={deuda.montoTotal} 
                      displayType={'text'} 
                      thousandSeparator="." 
                      decimalSeparator="," 
                      prefix="$" 
                      decimalScale={2} 
                      fixedDecimalScale
                    />
                  </div>
                </div>

                <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-400">Pagado</div>
                  <div className="text-lg font-semibold text-green-400">
                    <NumericFormat 
                      value={totalPagado} 
                      displayType={'text'} 
                      thousandSeparator="." 
                      decimalSeparator="," 
                      prefix="$" 
                      decimalScale={2} 
                      fixedDecimalScale
                    />
                  </div>
                </div>

                <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-400">Saldo pendiente</div>
                  <div className={`text-lg font-semibold ${
                    saldoPendiente > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    <NumericFormat 
                      value={saldoPendiente} 
                      displayType={'text'} 
                      thousandSeparator="." 
                      decimalSeparator="," 
                      prefix="$" 
                      decimalScale={2} 
                      fixedDecimalScale
                    />
                  </div>
                </div>
              </div>

              {/* Secciones colapsables */}
              <div className="space-y-3">
                {/* Detalle de cuotas */}
                <div 
                  className="bg-gray-700 p-3 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition"
                  onClick={() => setMostrarCuotas(!mostrarCuotas)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                      <BadgeDollarSign size={18} className="text-indigo-400" />
                      Detalle de Cuotas
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded-full">
                        {deuda.deudas?.length || 0} cuotas
                      </span>
                      {mostrarCuotas ? (
                        <ChevronUp className="text-gray-500" size={18} />
                      ) : (
                        <ChevronDown className="text-gray-500" size={18} />
                      )}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {mostrarCuotas && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2">
                          {deuda.deudas?.map((cuota) => {
                            const saldoCuota = calcularSaldoCuota(cuota);
                            const estaPagada = cuota.pagado || saldoCuota <= 0;
                            const porcentajeCuotaPagada = Math.round(((cuota.monto - saldoCuota) / cuota.monto) * 100);
                            
                            return (
                              <div key={cuota.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700 shadow-xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      {estaPagada ? (
                                        <Check className="text-green-500" size={16} />
                                      ) : (
                                        <Clock className="text-yellow-500" size={16} />
                                      )}
                                      <span className={`font-medium ${
                                        estaPagada ? "text-gray-400" : "text-white"
                                      }`}>
                                        {cuota.metodo || "Cuota"} - Vence: {cuota.fechaVencimiento ? formatFecha(cuota.fechaVencimiento) : "No especificado"}
                                      </span>
                                    </div>
                                    
                                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          estaPagada ? 'bg-green-500' : 'bg-yellow-500'
                                        }`} 
                                        style={{ width: `${porcentajeCuotaPagada}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <span className={`block ${
                                      estaPagada ? "text-gray-500 line-through" : "text-white font-semibold"
                                    }`}>
                                      <NumericFormat 
                                        value={cuota.monto} 
                                        displayType={'text'} 
                                        thousandSeparator="." 
                                        decimalSeparator="," 
                                        prefix="$" 
                                        decimalScale={2} 
                                        fixedDecimalScale
                                      />
                                    </span>
                                    {!estaPagada && saldoCuota < cuota.monto && (
                                      <div className="text-xs text-yellow-400">
                                        Saldo: <NumericFormat 
                                          value={saldoCuota} 
                                          displayType={'text'} 
                                          thousandSeparator="." 
                                          decimalSeparator="," 
                                          prefix="$" 
                                          decimalScale={2} 
                                          fixedDecimalScale
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="mt-2 flex justify-end">
                                  {estaPagada ? (
                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                      Pagado el {cuota.fechaUltimoPago ? formatFecha(cuota.fechaUltimoPago) : "No especificado"}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRegistrarPago(deuda, cuota.id);
                                      }}
                                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                                    >
                                      <DollarSign size={14} />
                                      Registrar pago
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Historial de pagos */}
                {(deuda.deudas?.some(c => c.pagos?.length > 0) || deuda.pagos?.length > 0) && (
                  <div 
                    className="bg-gray-700 p-3 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition"
                    onClick={() => setMostrarHistorial(!mostrarHistorial)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                        <Clock size={18} className="text-indigo-400" />
                        Historial de Pagos
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded-full">
                          {deuda.deudas?.reduce((sum, c) => sum + (c.pagos?.length || 0), 0) + (deuda.pagos?.length || 0)} pagos
                        </span>
                        {mostrarHistorial ? (
                          <ChevronUp className="text-gray-500" size={18} />
                        ) : (
                          <ChevronDown className="text-gray-500" size={18} />
                        )}
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {mostrarHistorial && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2">
                            {/* Pagos generales (si existen) */}
                            {deuda.pagos?.map((pago, index) => (
                              <div key={`pago-${index}`} className="p-3 bg-gray-800 rounded-lg border border-gray-700 shadow-xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`p-1 rounded-full ${
                                        pago.metodoPago === 'efectivo' ? 'bg-green-900/50 text-green-400' :
                                        pago.metodoPago === 'tarjeta' ? 'bg-blue-900/50 text-blue-400' :
                                        'bg-purple-900/50 text-purple-400'
                                      }`}>
                                        {pago.metodoPago === 'efectivo' ? <Receipt size={14} /> :
                                         pago.metodoPago === 'tarjeta' ? <CreditCard size={14} /> :
                                         <Banknote size={14} />}
                                      </div>
                                      <span className="font-medium text-white">
                                        {formatFecha(pago.fecha)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                      {pago.observaciones || "Pago registrado"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-green-400 font-semibold">
                                      <NumericFormat 
                                        value={pago.monto} 
                                        displayType={'text'} 
                                        thousandSeparator="." 
                                        decimalSeparator="," 
                                        prefix="$" 
                                        decimalScale={2} 
                                        fixedDecimalScale
                                      />
                                    </div>
                                    {pago.montoIntereses > 0 && (
                                      <div className="text-xs text-yellow-400">
                                        + <NumericFormat 
                                          value={pago.montoIntereses} 
                                          displayType={'text'} 
                                          thousandSeparator="." 
                                          decimalSeparator="," 
                                          prefix="$" 
                                          decimalScale={2} 
                                          fixedDecimalScale
                                        /> intereses
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Pagos por cuota */}
                            {deuda.deudas?.flatMap((cuota) => 
                              cuota.pagos?.map((pago, index) => (
                                <div key={`cuota-${cuota.id}-pago-${index}`} className="p-3 bg-gray-800 rounded-lg border border-gray-700 shadow-xs">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className={`p-1 rounded-full ${
                                          pago.metodoPago === 'efectivo' ? 'bg-green-900/50 text-green-400' :
                                          pago.metodoPago === 'tarjeta' ? 'bg-blue-900/50 text-blue-400' :
                                          'bg-purple-900/50 text-purple-400'
                                        }`}>
                                          {pago.metodoPago === 'efectivo' ? <Receipt size={14} /> :
                                           pago.metodoPago === 'tarjeta' ? <CreditCard size={14} /> :
                                           <Banknote size={14} />}
                                        </div>
                                        <span className="font-medium text-white">
                                          {formatFecha(pago.fecha)} - {cuota.metodo || "Cuota"}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-400">
                                        {pago.observaciones || "Pago de cuota registrado"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-green-400 font-semibold">
                                        <NumericFormat 
                                          value={pago.monto} 
                                          displayType={'text'} 
                                          thousandSeparator="." 
                                          decimalSeparator="," 
                                          prefix="$" 
                                          decimalScale={2} 
                                          fixedDecimalScale
                                        />
                                      </div>
                                      {pago.montoIntereses > 0 && (
                                        <div className="text-xs text-yellow-400">
                                          + <NumericFormat 
                                            value={pago.montoIntereses} 
                                            displayType={'text'} 
                                            thousandSeparator="." 
                                            decimalSeparator="," 
                                            prefix="$" 
                                            decimalScale={2} 
                                            fixedDecimalScale
                                          /> intereses
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}