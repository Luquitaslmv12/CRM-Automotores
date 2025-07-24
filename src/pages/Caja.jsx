import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



export default function Caja() {
  const [pagos, setPagos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(dayjs().format("YYYY-MM"));
  const [loading, setLoading] = useState(false);

  const inputMesRef = useRef();


  function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Reemplazar coma por punto y eliminar otros caracteres no numéricos salvo punto
    const cleaned = value.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

  // Función para traer nombre de proveedor por ID
  const getNombreProveedor = async (idTaller) => {
  if (!idTaller) return null;
  try {
    const docRef = doc(db, "proveedores", idTaller);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().nombre; // El campo que tiene el nombre
    }
  } catch (error) {
    console.error("Error obteniendo proveedor:", error);
  }
  return null;
};


const getResumenVehiculo = async (vehiculoId) => {
  if (!vehiculoId) return null;
  try {
    const docRef = doc(db, "vehiculos", vehiculoId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return `${data.marca || "Marca"} ${data.modelo || "Modelo"} - Dominio: ${data.patente || "No especificado"}`;
    }
  } catch (error) {
    console.error("Error obteniendo vehículo:", error);
  }
  return null;
};


  useEffect(() => {
    const fetchMovimientos = async () => {
      setLoading(true);
      try {
        const [ventasSnap, comprasSnap, pagosSnap ] = await Promise.all([
          
          getDocs(collection(db, "ventas")),
          getDocs(collection(db, "compras")),
          getDocs(collection(db, "pagos")),
        ]);
        

        const mes = dayjs(mesSeleccionado);

        // Ingresos de ventas
        const ingresosFiltrados = ventasSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((v) => dayjs(v.fecha?.toDate?.() || v.fecha).isSame(mes, "month"));

        // Egresos de compras
        const egresosCompras = comprasSnap.docs
          .map((doc) => ({
            id: doc.id,
            tipo: "compra",
            ...doc.data(),
          }))
          .filter((v) =>
            dayjs(v.fecha?.toDate?.() || v.fecha).isSame(mes, "month")
          );

        // Egresos de pagos con nombre de proveedor
       const egresosPagosRaw = pagosSnap.docs
  .map((doc) => ({
    id: doc.id,
    tipo: "pago",
    ...doc.data(),
  }))
  .filter((p) =>
    dayjs(p.fecha?.toDate?.() || p.fecha).isSame(mes, "month")
  );

  const getDescripcionReparacion = async (reparacionId) => {
  if (!reparacionId) return null;
  try {
    const docRef = doc(db, "reparaciones", reparacionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().descripcionReparacion || null;
    }
  } catch (error) {
    console.error("Error obteniendo descripción de reparación:", error);
  }
  return null;
};


// Ahora obtenemos el nombre del proveedor para cada pago:
const egresosPagos = await Promise.all(
  egresosPagosRaw.map(async (pago) => {
    const nombreProveedor = await getNombreProveedor(pago.tallerId);
    const resumenVehiculo = await getResumenVehiculo(pago.vehiculoId);
    const descripcionReparacion = await getDescripcionReparacion(pago.reparacionId); // <-- acá
    return {
      ...pago,
      nombreProveedor,
      resumenVehiculo,
      descripcionReparacion,  // <-- la agregás aquí
    };
  })
);




        // Filtrar egresosPagos por mes
        const egresosPagosFiltrados = egresosPagos.filter((p) =>
          dayjs(p.fecha?.toDate?.() || p.fecha).isSame(mes, "month")
        );

        // Unir egresos
        const todosLosEgresos = [...egresosCompras, ...egresosPagosFiltrados];

        setIngresos(ingresosFiltrados);
        setEgresos(todosLosEgresos);
        setPagos(egresosPagosFiltrados); // opcional
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, [mesSeleccionado]);

  const totalIngresos = ingresos.reduce(
  (acc, v) => acc + parseNumber(v.monto),
  0
);

const egresosCompras = egresos.filter(e => e.tipo === "compra");
const egresosPagos = egresos.filter(e => e.tipo === "pago");

const totalCompras = egresosCompras.reduce(
  (acc, e) => acc + parseNumber(e.monto ?? e.precioCompra ?? 0),
  0
);

const totalPagos = egresosPagos.reduce(
  (acc, e) => acc + parseNumber(e.monto ?? 0),
  0
);

const totalEgresos = egresos.reduce((acc, e) => acc + parseNumber(e.monto), 0);

const saldo = totalIngresos - totalEgresos;

  // Formatear fecha para mostrar
  const mesMostrado = dayjs(mesSeleccionado).locale("es").format("MMMM YYYY");

  console.log("Ingresos:", totalIngresos);
console.log("Egresos total:", totalEgresos);

console.log("Saldo:", saldo);



// Componente de tarjeta animada
const AnimatedCard = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Componente de acordeón para transacciones
const TransactionAccordion = ({ title, items, icon, color, emptyMessage }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 ${color.text} ${color.bg} bg-opacity-10`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-white/20">
            {items.length} registros
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-4 max-h-80 overflow-y-auto custom-scrollbar">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <TransactionItem
                    key={item.id}
                    item={item}
                    color={color}
                    index={index}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6 text-white/50"
                >
                  {emptyMessage}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de ítem de transacción
const TransactionItem = ({ item, color, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-lg p-3 border ${color.border} ${color.bg} bg-opacity-10 backdrop-blur-sm`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full"
          >
            <p className="font-medium text-white">
              {item.tipo === "pago" ? (
                <>
                  Pago a {item.nombreProveedor || "Proveedor"}
                </>
              ) : (
                <>
                  {item.marca || "Producto"} {item.modelo || ""}
                </>
              )}
            </p>
            <p className="text-xs text-white/70 mt-1">
              {dayjs(item.fecha?.toDate?.() || item.fecha).format("DD/MM/YYYY")}
            </p>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="text-xs space-y-1 text-white/80">
                  {item.tipo === "pago" && (
                    <>
                      <p>
                        <span className="font-semibold">Vehículo:</span>{" "}
                        {item.resumenVehiculo || "No especificado"}
                      </p>
                      <p>
                        <span className="font-semibold">Reparación:</span>{" "}
                        {item.descripcionReparacion || "No especificada"}
                      </p>
                    </>
                  )}
                  {item.tipo === "compra" && (
                    <p>
                      <span className="font-semibold">Detalle:</span>{" "}
                      {item.descripcion || "Sin detalles"}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className={`font-bold ${color.text} flex items-center gap-1`}>
          {item.tipo === "pago" ? "-" : "+"}
          {Number(item.monto || item.precioCompra).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
          <ArrowRight className="w-4 h-4" />
        </p>
      </div>
    </motion.div>
  );
};

  const theme = {
    ingresos: {
      text: "text-emerald-400",
      bg: "bg-emerald-400",
      border: "border-emerald-400/30",
    },
    egresos: {
      text: "text-rose-400",
      bg: "bg-rose-400",
      border: "border-rose-400/30",
    },
    saldo: {
      positive: {
        text: "text-blue-400",
        bg: "bg-blue-400",
        border: "border-blue-400/30",
      },
      negative: {
        text: "text-amber-400",
        bg: "bg-amber-400",
        border: "border-amber-400/30",
      },
    },
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6"
        >
          <div>
            <motion.h1 
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Gestión Financiera
            </motion.h1>
            <motion.p 
              className="text-gray-400 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Resumen completo de ingresos y egresos
            </motion.p>
          </div>

          <motion.div
            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl shadow-sm border border-white/10 p-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CalendarIcon className="w-5 h-5 text-cyan-400" />
            <input
              ref={inputMesRef}
              type="month"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="border-none bg-transparent focus:outline-none focus:ring-0 font-medium cursor-pointer text-white"
            />
          </motion.div>
        </motion.div>

        {/* Resumen del mes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-10"
        >
          <h2 className="text-xl font-semibold text-gray-300 mb-4">
            Resumen de {dayjs(mesSeleccionado).locale("es").format("MMMM YYYY")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tarjeta de Ingresos - Versión sutil */}
<AnimatedCard delay={0}>
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 h-full hover:border-emerald-400/30 transition-all duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-300 font-medium">Ingresos</p>
        <p className="text-2xl font-bold text-white mt-1">
          {totalIngresos.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {ingresos.length} {ingresos.length === 1 ? 'transacción' : 'transacciones'}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-emerald-400/20 backdrop-blur-sm">
        <TrendingUp className="text-emerald-300 w-6 h-6" />
      </div>
    </div>
    <motion.div
      initial={{ width: 0 }}
      animate={{ 
        width: `${Math.min(100, (totalIngresos / Math.max(totalIngresos + totalEgresos, 1)) * 100)}%`,
        backgroundColor: '#34d399' // Verde más suave
      }}
      transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
      className="h-1 rounded-full mt-4 bg-emerald-400/70"
    />
  </div>
</AnimatedCard>

{/* Tarjeta de Egresos - Versión sutil */}
<AnimatedCard delay={1}>
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 h-full hover:border-rose-400/30 transition-all duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-300 font-medium">Egresos</p>
        <p className="text-2xl font-bold text-white mt-1">
          {totalEgresos.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {egresos.length} {egresos.length === 1 ? 'transacción' : 'transacciones'}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-rose-400/20 backdrop-blur-sm">
        <TrendingDown className="text-rose-300 w-6 h-6" />
      </div>
    </div>
    <motion.div
      initial={{ width: 0 }}
      animate={{ 
        width: `${Math.min(100, (totalEgresos / Math.max(totalIngresos + totalEgresos, 1)) * 100)}%`,
        backgroundColor: '#f87171b5' // Rojo más suave
      }}
      transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
      className="h-1 rounded-full mt-4 bg-rose-400/70"
    />
  </div>
</AnimatedCard>

            {/* Tarjeta de Saldo */}
            <AnimatedCard delay={2}>
              <div className={`bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-5 border ${
                saldo >= 0 ? "border-emerald-400/30" : "border-amber-400/30"
              } h-full`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Saldo neto</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      saldo >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {saldo.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </p>
                    <p className={`text-xs mt-2 ${
                      saldo >= 0 ? "text-emerald-400/80" : "text-amber-400/80"
                    }`}>
                      {saldo >= 0 ? "Balance positivo" : "Balance negativo"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    saldo >= 0 ? "bg-emerald-400/10" : "bg-amber-400/10"
                  }`}>
                    <Wallet className={`w-6 h-6 ${
                      saldo >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`} />
                  </div>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.abs(saldo) / Math.max(totalIngresos, totalEgresos) * 100)}%` }}
                  transition={{ delay: 0.7, duration: 1 }}
                  className={`h-1 rounded-full mt-4 ${
                    saldo >= 0 ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
              </div>
            </AnimatedCard>
          </div>
        </motion.div>

        {/* Detalle de transacciones */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="w-12 h-12 text-cyan-400" />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
          >
            {/* Ingresos */}
            <TransactionAccordion
              title="Ingresos"
              items={ingresos}
              icon={<PlusCircle className="w-5 h-5 text-emerald-400" />}
              color={theme.ingresos}
              emptyMessage="No hay ingresos registrados este mes"
            />

            {/* Egresos */}
            <TransactionAccordion
              title="Egresos"
              items={egresos}
              icon={<MinusCircle className="w-5 h-5 text-rose-400" />}
              color={theme.egresos}
              emptyMessage="No hay egresos registrados este mes"
            />
          </motion.div>
        )}

        {/* Gráfico de distribución (placeholder animado) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-10"
        >
          <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp className="text-cyan-400 w-5 h-5" />
            Distribución mensual
          </h3>
          <div className="h-64 flex items-end justify-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(totalIngresos / Math.max(totalIngresos + totalEgresos, 1)) * 100}%` }}
              transition={{ delay: 0.9, duration: 1 }}
              className="bg-emerald-400 w-10 rounded-t-sm"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(totalEgresos / Math.max(totalIngresos + totalEgresos, 1)) * 100}%` }}
              transition={{ delay: 1, duration: 1 }}
              className="bg-rose-400 w-10 rounded-t-sm"
            />
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full" />
              <span className="text-sm text-gray-400">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-400 rounded-full" />
              <span className="text-sm text-gray-400">Egresos</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

  
    
