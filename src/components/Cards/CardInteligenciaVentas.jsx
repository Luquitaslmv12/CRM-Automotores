import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  where,
  query,
  Timestamp,
} from "firebase/firestore";
import { motion, useAnimation } from "framer-motion";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function AnimatedNumber({ value, duration = 1.2 }) {
  const controls = useAnimation();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    controls.start({
      val: value,
      transition: { duration, ease: "easeOut" },
    });
  }, [value]);

  return (
    <motion.span
      initial={{ val: 0 }}
      animate={controls}
      onUpdate={(latest) => setDisplay(latest.val.toFixed(2))}
      className="tabular-nums"
    >
      {display}
    </motion.span>
  );
}

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
    });
  }

  return meses;
};

export default function CardInteligenciaVentas() {
  const [estado, setEstado] = useState(null);
  const [dataGrafico, setDataGrafico] = useState([]);
  const [chartHeight, setChartHeight] = useState(150);

  useEffect(() => {
    function ajustarAltura() {
      const width = window.innerWidth;
      if (width < 640) setChartHeight(120);
      else if (width < 1024) setChartHeight(140);
      else setChartHeight(180);
    }
    ajustarAltura();
    window.addEventListener("resize", ajustarAltura);
    return () => window.removeEventListener("resize", ajustarAltura);
  }, []);

  useEffect(() => {
    const analizar = async () => {
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
          nombre: m.nombre.toUpperCase(),
          original: ventasPorMes[`${m.anio}-${m.mes}`],
        }))
      );
    };

    analizar();
  }, []);

  if (!estado) return null;

  const color = estado.arriba ? "text-green-600" : "text-red-600";
  const Icon = estado.arriba ? ArrowUpCircle : ArrowDownCircle;
  const mensaje = estado.arriba ? `📈 ¡Buen trabajo! Estás ` : `📉 Estás `;

  const maxValor = Math.max(...dataGrafico.map((d) => d.original), 1);
  const dataNormalizada = dataGrafico.map((d) => ({
    nombre: d.nombre,
    porcentaje: Math.round((d.original / maxValor) * 100),
    original: d.original,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-5 rounded-xl shadow border-l-4 ${
        estado.arriba ? "border-green-500" : "border-red-500"
      } flex flex-col gap-4`}
    >
      <div className="flex items-center gap-4">
        <Icon className={`${color} w-8 h-8`} />
        <h4 className={`text-lg font-medium ${color} sm:text-xl`}>
          Análisis de Rendimiento
        </h4>
      </div>

      <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
        {mensaje}
        <motion.span className={`${color} font-semibold`}>
          <AnimatedNumber value={Math.abs(estado.porcentaje)} />%
        </motion.span>
        {estado.arriba
          ? " arriba del promedio de los últimos 3 meses. ¡Buen trabajo!"
          : " por debajo del promedio. ¡Podés remontarlo!"}
      </p>

      <div className="flex justify-around text-center text-gray-700 dark:text-gray-300 font-semibold text-sm sm:text-base">
        <div>
          <div className="text-xl sm:text-2xl">
            ${<AnimatedNumber value={estado.ventasMesActual} />}
          </div>
          <div>Ventas este mes</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl">
            ${<AnimatedNumber value={estado.promedio} />}
          </div>
          <div>Promedio últimos 3 meses</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={dataNormalizada}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
          <XAxis dataKey="nombre" />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f293790",
              border: "none",
              borderRadius: 6,
            }}
            formatter={(value, name, props) =>
              `$${props.payload.original.toLocaleString("es-AR")}`
            }
          />
          <Bar
            contentStyle={{
              backgroundColor: "#1f293724",
              border: "none",
              borderRadius: 6,
            }}
            dataKey="porcentaje"
            fill={estado.arriba ? "#22c55e" : "#ef4444"}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
