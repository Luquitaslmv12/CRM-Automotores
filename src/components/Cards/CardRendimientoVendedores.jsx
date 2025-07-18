import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  where,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import Spinner from "../../components/Spinner/Spinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function calcularDias(inicio, fin) {
  return (fin - inicio) / (1000 * 60 * 60 * 24);
}

export default function CardRendimientoVendedores() {
  const hoy = new Date();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(hoy.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoy.getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const desde = Timestamp.fromDate(
        new Date(selectedYear, selectedMonth, 1)
      );
      const hasta = Timestamp.fromDate(
        new Date(selectedYear, selectedMonth + 1, 1)
      );

      const q = query(
        collection(db, "presupuestos"),
        where("fechaCreacion", ">=", desde),
        where("fechaCreacion", "<", hasta)
      );

      const snap = await getDocs(q);
      const data = {};

      snap.forEach((doc) => {
        const p = doc.data();
        const emitidoPor = p.emitidoPor || "Sin asignar";

        if (!data[emitidoPor]) {
          data[emitidoPor] = {
            emitidoPor,
            total: 0,
            cerrados: 0,
            totalDias: 0,
            conSeguimiento: 0,
          };
        }

        data[emitidoPor].total += 1;

        if (p.estado === "cerrado" && p.fechaCierre && p.fechaCreacion) {
          const fechaCreacionDate = p.fechaCreacion?.toDate?.();
          const fechaCierreDate = p.fechaCierre?.toDate?.();

          if (fechaCreacionDate && fechaCierreDate) {
            const dias = calcularDias(fechaCreacionDate, fechaCierreDate);
            data[emitidoPor].cerrados += 1;
            data[emitidoPor].totalDias += dias;
            data[emitidoPor].conSeguimiento += 1;
          }
        }
      });

      const resumen = Object.values(data).map((v) => ({
        emitidoPor: v.emitidoPor,
        presupuestos: v.total,
        tasaConversion: v.total > 0 ? (v.cerrados / v.total) * 100 : 0,
        seguimientoPromedio:
          v.conSeguimiento > 0 ? v.totalDias / v.conSeguimiento : 0,
      }));

      resumen.sort((a, b) => b.tasaConversion - a.tasaConversion);

      setRanking(resumen);
      setLoading(false);
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-xl shadow border-l-4 border-green-500 min-h-80"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <BadgeCheck className="w-6 h-6 text-green-400" />
          <h3 className="text-lg font-semibold text-white">
            Rendimiento de Vendedores
          </h3>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-2 py-1 rounded border bg-gray-700 text-white"
          >
            {meses.map((mes, i) => (
              <option key={i} value={i}>
                {mes}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2 py-1 rounded border bg-gray-700 text-white"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner text="Calculando rendimiento..." />
      ) : ranking.length === 0 ? (
        <p className="text-gray-400">No hay presupuestos para este periodo.</p>
      ) : (
        <>
          {/* BARRAS DE RANKING */}
          <div className="h-34">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} margin={{ top: 10, bottom: 10 }}>
                <XAxis
                  dataKey="emitidoPor"
                  tick={false} // oculta texto debajo de las barras
                  axisLine={false}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#e5e7eb", fontSize: 12 }}
                  width={40}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value.toFixed(1)}%`,
                    props.payload.emitidoPor,
                  ]}
                  labelFormatter={() => ""}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#10b981",
                  }}
                  itemStyle={{ color: "#f3f4f6" }}
                />
                <Bar
                  dataKey="tasaConversion"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                >
                  {ranking.map((_, index) => (
                    <Cell key={index} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* DETALLE DE KPIs */}
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {ranking.map((v) => (
              <div
                key={v.emitidoPor}
                className="p-2 bg-slate-800 rounded-lg border border-slate-700"
              >
                <h4 className="font-semibold text-white mb-1">
                  {v.emitidoPor}
                </h4>
                <div className="text-sm text-gray-300">
                  Presupuestos: <strong>{v.presupuestos}</strong>
                </div>
                <div className="text-sm text-gray-300">
                  Conversión: <strong>{v.tasaConversion.toFixed(1)}%</strong>
                </div>
                <div className="text-sm text-gray-300">
                  Seguimiento promedio:{" "}
                  <strong>{v.seguimientoPromedio.toFixed(1)} días</strong>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
