import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
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
  }).format(n);

export default function CardVentasDelMes() {
  const [ventas, setVentas] = useState({ actual: 0, anterior: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchVentas = async () => {
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

      const snapActual = await getDocs(qActual);
      const snapAnterior = await getDocs(qAnterior);

      const totalActual = snapActual.docs.reduce(
        (sum, doc) => sum + (doc.data().monto || 0),
        0
      );
      const totalAnterior = snapAnterior.docs.reduce(
        (sum, doc) => sum + (doc.data().monto || 0),
        0
      );

      setVentas({ actual: totalActual, anterior: totalAnterior });
      setMounted(true);
    };

    fetchVentas();
  }, []);

  const diferencia = ventas.actual - ventas.anterior;
  const variacion =
    ventas.anterior > 0 ? (diferencia / ventas.anterior) * 100 : 100;
  const isPositive = variacion >= 0;

  const chartData = [
    { name: "Mes anterior", monto: ventas.anterior },
    { name: "Mes actual", monto: ventas.actual },
  ];

  const barColors = ["#b6b83f", isPositive ? "#10b981" : "#ef4444"]; // gray-400 y verde o rojo

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow border-l-4 border-green-500 flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <DollarSign className="text-green-600 w-8 h-8" />
        <div>
          <h3 className="text-xl font-semibold">Ventas del Mes</h3>
          <motion.p
            className="text-2xl font-bold"
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            {mounted ? formatCurrency(ventas.actual) : "Cargando..."}
          </motion.p>
          <p
            className={`text-sm ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(variacion).toFixed(1)}% respecto
            al mes anterior
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap={30}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#dddfd4", fontSize: 16 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "#000000c7", // fondo oscuro
              border: "none",
              borderRadius: 6,
              color: "#e9edf1", // texto del tooltip en blanco
            }}
            labelStyle={{ color: "#e9edf1" }} // texto de la etiqueta también blanco
            itemStyle={{ color: "#1be425" }} // color de los valores individuales
            formatter={(value) => formatCurrency(value)}
          />
          <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
