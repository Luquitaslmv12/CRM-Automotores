import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import {
  collection,
  getDocs,
  where,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

const getMonthRange = (offset = 0) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return {
    from: Timestamp.fromDate(firstDay),
    to: Timestamp.fromDate(new Date(lastDay.getTime() + 86400000)),
  };
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n);

const formatShortCurrency = (n) => {
  if (n >= 1000000) {
    return `$${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `$${(n / 1000).toFixed(1)}K`;
  }
  return formatCurrency(n);
};

export default function CardVentasDelMes() {
  const [data, setData] = useState({
    actual: { monto: 0, cantidad: 0 },
    anterior: { monto: 0, cantidad: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        setLoading(true);
        setError(null);

        const { from: thisFrom, to: thisTo } = getMonthRange(0);
        const { from: lastFrom, to: lastTo } = getMonthRange(-1);

        const ventasRef = collection(db, "ventas");

        const qActual = query(
          ventasRef,
          where("fecha", ">=", thisFrom),
          where("fecha", "<", thisTo)
        );
        const qAnterior = query(
          ventasRef,
          where("fecha", ">=", lastFrom),
          where("fecha", "<", lastTo)
        );

        const [snapActual, snapAnterior] = await Promise.all([
          getDocs(qActual),
          getDocs(qAnterior),
        ]);

        const totalActual = snapActual.docs.reduce(
          (sum, doc) => sum + (doc.data().monto || 0),
          0
        );
        const totalAnterior = snapAnterior.docs.reduce(
          (sum, doc) => sum + (doc.data().monto || 0),
          0
        );

        setData({
          actual: { monto: totalActual, cantidad: snapActual.size },
          anterior: { monto: totalAnterior, cantidad: snapAnterior.size },
        });
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Error al cargar los datos de ventas");
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, []);

  const diferenciaMonto = data.actual.monto - data.anterior.monto;
  const diferenciaCantidad = data.actual.cantidad - data.anterior.cantidad;
  const variacionMonto =
    data.anterior.monto > 0
      ? (diferenciaMonto / data.anterior.monto) * 100
      : 100;
  const variacionCantidad =
    data.anterior.cantidad > 0
      ? (diferenciaCantidad / data.anterior.cantidad) * 100
      : 100;

  const isPositiveMonto = variacionMonto >= 0;
  const isPositiveCantidad = variacionCantidad >= 0;

  const chartData = [
    { name: "Mes anterior", monto: data.anterior.monto },
    { name: "Mes actual", monto: data.actual.monto },
  ];

  const barColors = ["#64748b", isPositiveMonto ? "#10b981" : "#ef4444"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow-lg border-l-4 border-emerald-500 hover:shadow-emerald-500/10 transition-all min-h-80 h-full flex flex-col"
    >
      <div className="flex justify-between items-start mb-6">
        {" "}
        {/* Cambiado aquí */}
        <div className="flex-1">
          {" "}
          {/* Añadido flex-1 para que ocupe el espacio disponible */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg">
              <DollarSign className="w-8 h-8 text-emerald-400 sm:w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-2xl font-semibold text-white">
              Ventas del Mes
            </h3>
          </div>
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : error ? (
              <motion.p
                className="text-red-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            ) : (
              <div className="flex justify-between items-end w-full">
                {" "}
                {/* Modificado aquí */}
                <motion.p
                  className="text-2xl font-semibold text-indigo-400"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {formatCurrency(data.actual.monto)}
                </motion.p>
                <div className="flex items-center gap-2 ml-4">
                  <ShoppingBag className="w-6 h-6 text-emerald-400" />
                  <span className="text-xl font-semibold text-white">
                    {data.actual.cantidad}
                  </span>
                  <span
                    className={`text-s ${
                      isPositiveCantidad ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    ventas ({isPositiveCantidad ? "↑" : "↓"}{" "}
                    {Math.abs(diferenciaCantidad)})
                  </span>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              isPositiveMonto ? "bg-emerald-500/20" : "bg-red-500/20"
            }`}
          >
            {isPositiveMonto ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            )}
            <span
              className={`text-s font-medium animate-pulse ${
                isPositiveMonto ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {Math.abs(variacionMonto).toFixed(1)}%
            </span>
          </motion.div>
        )}
      </div>

      <div className="mt-auto h-40">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barCategoryGap={30}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#919cb68b",
                  border: "1px solid #1e293b",
                  borderRadius: 6,
                  color: "#f8fafc",
                }}
                formatter={(value) => [formatCurrency(value), "Monto"]}
                labelFormatter={(label) => (
                  <span className="text-emerald-400">{label}</span>
                )}
                cursor={{ fill: "#1e293b" }}
              />
              <Bar
                dataKey="monto"
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index]} />
                ))}
                <LabelList
                  dataKey="monto"
                  position="top"
                  formatter={formatShortCurrency}
                  fill="#e2e8f0"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && !error && (
        <div className="mt-4 flex justify-between items-center text-sm text-slate-400">
          <div>
            <span>Mes anterior: {formatCurrency(data.anterior.monto)}</span>
            <span className="block text-xs">
              {data.anterior.cantidad} ventas
            </span>
          </div>
          <div className="text-right">
            <span
              className={`${
                isPositiveMonto ? "text-emerald-400" : "text-red-400"
              } font-medium`}
            >
              {isPositiveMonto ? "+" : ""}
              {formatCurrency(diferenciaMonto)}
            </span>
            <span
              className={`block text-xs ${
                isPositiveCantidad ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositiveCantidad ? "+" : ""}
              {diferenciaCantidad} ventas
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
