import { useState, useEffect } from "react";
import { db } from "../firebase";
import "dayjs/locale/es";
import { collection, getDocs, query, where } from "firebase/firestore";
import dayjs from "dayjs";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  Loader2,
  BarChart2,
  PieChart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GestionCaja() {
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [mes, setMes] = useState(dayjs().format("YYYY-MM"));
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const mesActual = dayjs(mes);
        const startOfMonth = mesActual.startOf("month").toDate();
        const endOfMonth = mesActual.endOf("month").toDate();

        const [ventasSnap, comprasSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "ventas"),
              where("fecha", ">=", startOfMonth),
              where("fecha", "<=", endOfMonth)
            )
          ),
          getDocs(
            query(
              collection(db, "compras"),
              where("fecha", ">=", startOfMonth),
              where("fecha", "<=", endOfMonth)
            )
          ),
        ]);

        const ventasFiltradas = ventasSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            tipo: "venta",
            resumenVehiculo: data.vehiculoResumen
              ? `${data.vehiculoResumen.marca} ${data.vehiculoResumen.modelo} - ${data.vehiculoResumen.patente}`
              : "Vehículo no especificado",
          };
        });

        const comprasFiltradas = comprasSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            tipo: "compra",
            resumenVehiculo: `${data.marca} ${data.modelo} - ${data.patente}`,
          };
        });

        setVentas(ventasFiltradas);
        setCompras(comprasFiltradas);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mes]);

  const totalIngresos = ventas.reduce((sum, v) => sum + (v.monto || 0), 0);
  const totalEgresos = compras.reduce(
    (sum, c) => sum + (c.precioCompra || c.monto || 0),
    0
  );
  const balance = totalIngresos - totalEgresos;

  // Porcentaje para el gráfico
  const total = totalIngresos + totalEgresos;
  const ingresosPct = total > 0 ? (totalIngresos / total) * 100 : 0;
  const egresosPct = 100 - ingresosPct;

  // Datos para gráfico de tendencia (últimos 6 meses)
  const mesesAnteriores = Array.from({ length: 6 }, (_, i) =>
    dayjs(mes).subtract(i, "month").format("YYYY-MM")
  ).reverse();

  // Filtrar movimientos según el filtro seleccionado
  const movimientosFiltrados = [...ventas, ...compras]
    .sort((a, b) => {
      const dateA = dayjs(a.fecha?.toDate?.() || a.fecha);
      const dateB = dayjs(b.fecha?.toDate?.() || b.fecha);
      return dateB - dateA;
    })
    .filter((item) => {
      if (filter === "all") return true;
      if (filter === "income") return item.tipo === "venta";
      if (filter === "expenses") return item.tipo === "compra";
      return true;
    });

  const toggleExpandTransaction = (id) => {
    setExpandedTransaction(expandedTransaction === id ? null : id);
  };

  return (
    <div className="p-4 pt-20 md:pt-20 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-3xl font-bold text-white text-center flex justify-center items-center gap-2">
            <PieChart className="w-10 h-10 text-blue-500 animate-spin" />
            Gestión de Ventas
          </h1>
          <p className="text-slate-400 text-sm">
            Resumen completo de ingresos, egresos y balance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="pl-10 pr-3 py-2 text-slate-200 border rounded-lg bg-slate-800/60 border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-8 py-2 text-slate-200 border rounded-lg bg-slate-800/60 border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none text-sm"
            >
              <option value="all">Todos los movimientos</option>
              <option value="income">Solo ingresos</option>
              <option value="expenses">Solo egresos</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <ResumenCard
              title="Ingresos Totales"
              value={totalIngresos}
              change={10} // Ejemplo de cambio porcentual
              icon={<TrendingUp className="w-5 h-5" />}
              color="green"
              description="Ventas realizadas este mes"
            />
            <ResumenCard
              title="Egresos Totales"
              value={totalEgresos}
              change={-5}
              icon={<TrendingDown className="w-5 h-5" />}
              color="red"
              description="Compras e inversiones"
            />
            <ResumenCard
              title="Balance Final"
              value={balance}
              change={balance >= 0 ? 8 : -8}
              icon={<DollarSign className="w-5 h-5" />}
              color={balance >= 0 ? "green" : "red"}
              isBalance
              description={
                balance >= 0 ? "Resultado positivo" : "Resultado negativo"
              }
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de distribución */}
            <div className="bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-200">
                  Distribución Financiera
                </h3>
                <PieChart className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3"
                    />
                    <motion.path
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{
                        strokeDasharray: `${ingresosPct} ${100 - ingresosPct}`,
                      }}
                      transition={{ duration: 1 }}
                      className="circle"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <motion.path
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{
                        strokeDasharray: `${egresosPct} ${100 - egresosPct}`,
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="circle"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDashoffset={-ingresosPct}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-200">
                      {balance >= 0 ? "+" : ""}
                      {balance.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm font-medium text-slate-300">
                        Ingresos
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      {totalIngresos.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm font-medium text-slate-300">
                        Egresos
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      {totalEgresos.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">
                        Balance
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          balance >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {balance >= 0 ? "+" : ""}
                        {balance.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de tendencia */}
            <div className="bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-200">
                  Tendencia Histórica
                </h3>
                <BarChart2 className="w-5 h-5 text-slate-400" />
              </div>
              <div className="h-48">
                <div className="flex items-end h-40 gap-2">
                  {mesesAnteriores.map((mes, i) => {
                    // Datos simulados para la tendencia (en un caso real, deberías obtener estos datos)
                    const ingresos = Math.round(
                      Math.random() * 1000000 + 500000
                    );
                    const egresos = Math.round(Math.random() * 800000 + 300000);
                    const balance = ingresos - egresos;
                    const maxHeight = Math.max(ingresos, egresos);
                    const scale = 1500000; // Escala para normalizar los valores

                    return (
                      <div
                        key={mes}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div className="flex items-end w-full h-full gap-1">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(ingresos / scale) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="w-full bg-green-500 rounded-t-sm"
                            style={{ maxHeight: "100%" }}
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(egresos / scale) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
                            className="w-full bg-red-500 rounded-t-sm"
                            style={{ maxHeight: "100%" }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 mt-2">
                          {dayjs(mes).format("MMM")}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-xs text-slate-500">Ingresos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-xs text-slate-500">Egresos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Listado de movimientos */}
          <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white text-lg">
                    Movimientos Recientes
                  </h2>
                  <p className="text-sm :text-slate-400">
                    {dayjs(mes).locale("es").format("MMMM YYYY")}
                  </p>
                </div>
                <span className="text-sm font-medium :text-slate-400">
                  {movimientosFiltrados.length} registros
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-700">
              {movimientosFiltrados.length === 0 ? (
                <div className="p-8 text-center ext-slate-400">
                  No hay movimientos para mostrar en este período
                </div>
              ) : (
                <AnimatePresence>
                  {movimientosFiltrados.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MovimientoItem
                        item={item}
                        tipo={item.tipo}
                        isExpanded={expandedTransaction === item.id}
                        onToggleExpand={() => toggleExpandTransaction(item.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Componente de tarjeta de resumen mejorado
const ResumenCard = ({
  title,
  value,
  change,
  icon,
  color,
  isBalance = false,
  description,
}) => {
  const colorClasses = {
    green: {
      bg: "bg-green-900/20",
      border: "border-green-800/50",
      text: "text-green-400",
      change: "text-green-400",
    },
    red: {
      bg: "bg-red-900/20",
      border: "border-red-800/50",
      text: "text-red-400",
      change: "text-red-400",
    },
    blue: {
      bg: "bg-blue-900/20",
      border: "border-blue-800/50",
      text: "text-blue-400",
      change: "text-blue-400",
    },
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`p-5 rounded-xl border ${colorClasses[color].border} ${colorClasses[color].bg} transition-all shadow-sm`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">
            {value.toLocaleString("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: isBalance ? 2 : 0,
              maximumFractionDigits: 2,
            })}
          </p>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <div
            className={`p-3 rounded-lg ${colorClasses[color].text} ${
              isBalance ? "bg-slate-800 shadow-sm" : ""
            }`}
          >
            {icon}
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center mt-3 text-xs font-medium ${colorClasses[color].change}`}
            >
              {change >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(change)}% vs mes anterior
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Componente de ítem de movimiento mejorado
const MovimientoItem = ({ item, tipo, isExpanded, onToggleExpand }) => {
  const fecha = dayjs(item.fecha?.toDate?.() || item.fecha)
    .locale("es")
    .format("DD MMM YYYY");
  const monto = item.monto || item.precioCompra || 0;
  const isIncome = tipo === "venta";

  return (
    <div
      className={`p-4 hover:bg-slate-700/30 transition-colors cursor-pointer ${
        isExpanded ? "bg-slate-700/30" : ""
      }`}
      onClick={onToggleExpand}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`p-2 rounded-lg mt-1 flex-shrink-0 ${
              isIncome
                ? "bg-green-900/50 text-green-400"
                : "bg-red-900/50 text-red-400"
            }`}
          >
            {isIncome ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">
              {item.resumenVehiculo}
            </p>
            <p className="text-sm text-slate-400 mt-1">{fecha}</p>
            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Tipo:</span>
                    <span className="ml-2 font-medium text-slate-300">
                      {isIncome ? "Venta" : "Compra"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">ID:</span>
                    <span className="ml-2 font-medium text-slate-300">
                      {item.id.slice(0, 8)}...
                    </span>
                  </div>
                  {item.detalles && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Detalles:</span>
                      <span className="ml-2 font-medium text-slate-300">
                        {item.detalles}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p
            className={`font-semibold ${
              isIncome ? "text-green-400" : "text-red-400"
            }`}
          >
            {isIncome ? "+" : "-"}
            {monto.toLocaleString("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
};
