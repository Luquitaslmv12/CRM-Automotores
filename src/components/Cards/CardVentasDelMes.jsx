import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase";
import { collection, getDocs, where, query, Timestamp } from "firebase/firestore";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import { DollarSign } from "lucide-react";

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

      const qActual = query(ventasRef, where("fecha", ">=", thisFrom), where("fecha", "<", thisTo));
      const qAnterior = query(ventasRef, where("fecha", ">=", lastFrom), where("fecha", "<", lastTo));

      const snapActual = await getDocs(qActual);
      const snapAnterior = await getDocs(qAnterior);

      const totalActual = snapActual.docs.reduce((sum, doc) => sum + (doc.data().monto || 0), 0);
      const totalAnterior = snapAnterior.docs.reduce((sum, doc) => sum + (doc.data().monto || 0), 0);

      setVentas({ actual: totalActual, anterior: totalAnterior });
      setMounted(true);
    };

    fetchVentas();
  }, []);

  const diferencia = ventas.actual - ventas.anterior;
  const variacion = ventas.anterior > 0 ? (diferencia / ventas.anterior) * 100 : 100;
  const variacionColor = variacion >= 0 ? "text-green-500" : "text-red-500";

  const chartData = [
    { name: "Mes anterior", monto: ventas.anterior },
    { name: "Mes actual", monto: ventas.actual },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border-l-4 border-green-500 flex flex-col gap-4"
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
          <p className={`text-sm ${variacionColor}`}>
            {variacion >= 0 ? "▲" : "▼"} {Math.abs(variacion).toFixed(1)}% respecto al mes anterior
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData}>
          <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis hide />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Line
            type="monotone"
            dataKey="monto"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
