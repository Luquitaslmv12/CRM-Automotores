import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  where,
  query,
  Timestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  Cell,
} from "recharts";

const AnimatedNumber = ({
  value,
  duration = 1.2,
  prefix = "$",
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;
    const range = endValue - startValue;

    if (range === 0) return;

    const animation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2; // easeInOutQuad

      const currentValue = startValue + easedProgress * range;
      setDisplayValue(Math.floor(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }, [value]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {displayValue.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
    </span>
  );
};

const obtenerUltimosMeses = (cantidad = 4) => {
  const ahora = new Date();
  const meses = [];

  for (let i = cantidad - 1; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push({
      id: `${fecha.getFullYear()}-${fecha.getMonth()}`,
      mes: fecha.getMonth(),
      anio: fecha.getFullYear(),
      nombre: fecha.toLocaleString("es-AR", { month: "short" }),
      nombreCompleto: fecha.toLocaleString("es-AR", {
        month: "long",
        year: "numeric",
      }),
    });
  }

  return meses;
};

export default function CardInteligenciaVentas() {
  const [estado, setEstado] = useState(null);
  const [dataGrafico, setDataGrafico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const analizar = async () => {
      try {
        setLoading(true);
        setError(null);

        const meses = obtenerUltimosMeses(4);

        const desde = new Date(meses[0].anio, meses[0].mes, 1);
        const hasta = new Date(meses[3].anio, meses[3].mes + 1, 1);

        const q = query(
          collection(db, "ventas"),
          where("fecha", ">=", Timestamp.fromDate(desde)),
          where("fecha", "<", Timestamp.fromDate(hasta))
        );

        const snap = await getDocs(q);

        const ventasPorMes = Object.fromEntries(
          meses.map((m) => [`${m.anio}-${m.mes}`, 0])
        );

        snap.forEach((doc) => {
          const { fecha, monto } = doc.data();
          if (fecha?.toDate && monto) {
            const f = fecha.toDate();
            const clave = `${f.getFullYear()}-${f.getMonth()}`;
            if (ventasPorMes[clave] !== undefined) {
              ventasPorMes[clave] += monto;
            }
          }
        });

        const claves = Object.keys(ventasPorMes);
        const actualKey = claves[claves.length - 1];
        const montoActual = ventasPorMes[actualKey];
        const anteriores = claves.slice(0, -1).map((k) => ventasPorMes[k]);
        const promedio =
          anteriores.reduce((acc, val) => acc + val, 0) / anteriores.length;

        const diferencia = montoActual - promedio;
        const porcentaje = promedio ? (diferencia / promedio) * 100 : 0;

        setEstado({
          ventasMesActual: montoActual,
          promedio,
          porcentaje,
          arriba: diferencia >= 0,
        });

        setDataGrafico(
          meses.map((m) => ({
            ...m,
            original: ventasPorMes[`${m.anio}-${m.mes}`],
          }))
        );
      } catch (err) {
        console.error("Error en análisis de ventas:", err);
        setError("Error al cargar el análisis de ventas");
      } finally {
        setLoading(false);
      }
    };

    analizar();
  }, []);

  if (loading && !estado) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg border-l-4 border-red-500 flex flex-col items-center justify-center h-full min-h-[300px] text-red-400">
        <TrendingDown className="w-10 h-10 mb-2" />
        <p className="text-center">{error}</p>
      </div>
    );
  }

  const colorPrincipal = estado.arriba ? "emerald" : "rose";
  const colorBarra = estado.arriba ? "#10b981" : "#f43f5e";
  const Icon = estado.arriba ? ArrowUpCircle : ArrowDownCircle;
  const mensaje = estado.arriba
    ? "¡Excelente rendimiento! Estás "
    : "Oportunidad de mejora, estás ";

  // Calcular el valor máximo para la normalización
  const maxValor = Math.max(...dataGrafico.map((d) => d.original), 1);
  const dataConPorcentaje = dataGrafico.map((d) => ({
    ...d,
    porcentaje: Math.round((d.original / maxValor) * 100),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-5 rounded-xl shadow-lg border-l-4 border-${colorPrincipal}-500 hover:shadow-${colorPrincipal}-500/10 transition-all h-full flex flex-col min-h-80`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 bg-${colorPrincipal}-500/20 rounded-lg`}>
              {estado.arriba ? (
                <TrendingUp className={`text-${colorPrincipal}-400 w-8 h-8`} />
              ) : (
                <TrendingDown
                  className={`text-${colorPrincipal}-400 w-8 h-8`}
                />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">
              Rendimiento de Ventas
            </h3>
          </div>

          <p className="text-gray-300 text-sm">
            {mensaje}
            <span className={`text-${colorPrincipal}-400 font-medium`}>
              <AnimatedNumber
                value={Math.abs(estado.porcentaje)}
                prefix=""
                className={`text-${colorPrincipal}-400`}
              />
              %
            </span>
            {estado.arriba ? " sobre el promedio" : " bajo el promedio"}
          </p>
        </div>

        <motion.div
          animate={{
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? (estado.arriba ? 5 : -5) : 0,
          }}
          className={`p-2 rounded-full bg-${colorPrincipal}-500/10`}
        >
          <Icon className={`text-${colorPrincipal}-400 w-6 h-6`} />
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-4">
        <div className="bg-slate-700/30 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Este mes</p>
          <p className="text-xl font-bold text-white">
            <AnimatedNumber value={estado.ventasMesActual} />
          </p>
        </div>
        <div className="bg-slate-700/30 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Promedio últimos 3 meses</p>
          <p className="text-xl font-bold text-amber-400">
            <AnimatedNumber value={estado.promedio} />
          </p>
        </div>
      </div>

      <div className="mt-auto h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dataConPorcentaje}
            margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#334155"
            />
            <XAxis
              dataKey="nombre"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                background: "#757d8d8d",
                borderColor: "#1e293b",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name, props) => [
                `$${props.payload.original.toLocaleString("es-AR")}`,
                props.payload.nombreCompleto,
              ]}
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            />
            <Bar
              dataKey="porcentaje"
              animationDuration={1500}
              radius={[4, 4, 0, 0]}
            >
              {dataConPorcentaje.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === dataConPorcentaje.length - 1
                      ? colorBarra
                      : "#475569"
                  }
                />
              ))}
              <LabelList
                dataKey="original"
                position="top"
                formatter={(value) => `$${Math.round(value / 1000)}K`}
                fill="#e2e8f0"
                fontSize={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
        <span>Últimos 4 meses</span>
        <span className={`text-${colorPrincipal}-400 font-medium`}>
          {estado.arriba ? "Tendencia positiva" : "Tendencia a mejorar"}
        </span>
      </div>
    </motion.div>
  );
}
