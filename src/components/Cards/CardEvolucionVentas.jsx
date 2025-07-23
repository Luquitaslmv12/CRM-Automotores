import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  where,
  query,
  Timestamp,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Download,
  Calendar,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import Spinner from "../../components/Spinner/Spinner";

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

function formatCurrency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function CardEvolucionVentas() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [data, setData] = useState([]);
  const [hasComparison, setHasComparison] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("diario"); // 'diario' o 'acumulado'

  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true);
      const diasDelMes = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const labels = Array.from({ length: diasDelMes }, (_, i) => i + 1);

      // Fechas actuales
      const desde = Timestamp.fromDate(
        new Date(selectedYear, selectedMonth, 1)
      );
      const hasta = Timestamp.fromDate(
        new Date(selectedYear, selectedMonth + 1, 1)
      );

      // Fechas mismo mes año anterior
      const desdeAnt = Timestamp.fromDate(
        new Date(selectedYear - 1, selectedMonth, 1)
      );
      const hastaAnt = Timestamp.fromDate(
        new Date(selectedYear - 1, selectedMonth + 1, 1)
      );

      const ventasRef = collection(db, "ventas");

      // Query actual y año anterior
      const [snapActual, snapAnterior] = await Promise.all([
        getDocs(
          query(
            ventasRef,
            where("fecha", ">=", desde),
            where("fecha", "<", hasta)
          )
        ),
        getDocs(
          query(
            ventasRef,
            where("fecha", ">=", desdeAnt),
            where("fecha", "<", hastaAnt)
          )
        ),
      ]);

      // Data actual
      const totales = labels.map((dia) => ({
        dia,
        monto: 0,
        acumulado: 0,
        anterior: 0,
        promedio: 0,
      }));

      // Procesar datos actuales
      snapActual.forEach((doc) => {
        const { fecha, monto } = doc.data();
        if (fecha?.toDate && monto) {
          const day = fecha.toDate().getDate();
          if (totales[day - 1]) totales[day - 1].monto += monto;
        }
      });

      // Calcular acumulado
      totales.reduce((acc, curr) => {
        curr.acumulado = acc + curr.monto;
        return curr.acumulado;
      }, 0);

      // Procesar año anterior
      snapAnterior.forEach((doc) => {
        const { fecha, monto } = doc.data();
        if (fecha?.toDate && monto) {
          const day = fecha.toDate().getDate();
          if (totales[day - 1]) totales[day - 1].anterior += monto;
        }
      });

      setHasComparison(snapAnterior.size > 0);

      // Calcular promedio diario
      const proms = await calcularPromedioDiario(
        selectedMonth,
        selectedYear,
        diasDelMes
      );
      for (let i = 0; i < diasDelMes; i++) {
        totales[i].promedio = proms[i];
      }

      setData(totales);
      setLoading(false);
    };

    fetchVentas();
  }, [selectedMonth, selectedYear]);

  const calcularPromedioDiario = async (mes, anio, dias) => {
    const fechas = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(anio, mes - (i + 1), 1);
      const f = new Date(anio, mes - i, 1);
      return {
        from: Timestamp.fromDate(d),
        to: Timestamp.fromDate(f),
      };
    });

    const ventasRef = collection(db, "ventas");
    const montos = Array(dias).fill(0);
    const conteo = Array(dias).fill(0);

    for (const f of fechas) {
      const snap = await getDocs(
        query(
          ventasRef,
          where("fecha", ">=", f.from),
          where("fecha", "<", f.to)
        )
      );
      snap.forEach((doc) => {
        const { fecha, monto } = doc.data();
        if (fecha?.toDate && monto) {
          const dia = fecha.toDate().getDate();
          if (dia <= dias) {
            montos[dia - 1] += monto;
            conteo[dia - 1]++;
          }
        }
      });
    }

    return montos.map((total, i) => (conteo[i] > 0 ? total / conteo[i] : 0));
  };

  const exportarExcel = () => {
    const exportData = data.map((d) => ({
      Día: d.dia,
      Actual: d.monto,
      Acumulado: d.acumulado,
      "Año anterior": d.anterior,
      Promedio: d.promedio,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `ventas_${meses[selectedMonth]}_${selectedYear}.xlsx`);
  };

  // Calcular métricas resumen
  const totalActual = data.reduce((a, b) => a + b.monto, 0);
  const totalAnterior = data.reduce((a, b) => a + b.anterior, 0);
  const promedioDiario = data.reduce((a, b) => a + b.promedio, 0) / data.length;
  const diasConVentas = data.filter((d) => d.monto > 0).length;
  const variacion = hasComparison
    ? ((totalActual - totalAnterior) / totalAnterior) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow-lg flex flex-col gap-4 border-l-4 border-blue-500 hover:shadow-blue-500/10 transition-all min-h-80"
    >
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">
              Evolución de Ventas
            </h3>
            <p className="text-sm text-slate-400">
              {meses[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <Calendar className="absolute left-2 w-4 h-4 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="pl-8 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {meses.map((mes, i) => (
                  <option key={i} value={i}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Resumen de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-1 ">
        <MetricCard
          title="Total Actual"
          value={totalActual}
          formattedValue={formatCurrency(totalActual)}
          icon={<BarChart2 className="w-4 h-4 text-blue-500" />}
          color="blue"
          comparison={
            hasComparison && {
              value: variacion,
              isPositive: variacion >= 0,
            }
          }
        />

        <MetricCard
          title="Año Anterior"
          value={totalAnterior}
          formattedValue={formatCurrency(totalAnterior)}
          icon={<TrendingUp className="w-4 h-4 text-amber-500" />}
          color="amber"
        />

        <MetricCard
          title="Promedio Diario"
          value={promedioDiario}
          formattedValue={formatCurrency(promedioDiario)}
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
          color="emerald"
        />

        <MetricCard
          title="Días con Ventas"
          value={diasConVentas}
          formattedValue={`${diasConVentas} días`}
          icon={<Calendar className="w-4 h-4 text-purple-400" />}
          color="purple"
        />
      </div>

      {/* Selector de vista */}
      <div className="flex border-b border-slate-700">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "diario"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-slate-400 hover:text-slate-300"
          }`}
          onClick={() => setActiveTab("diario")}
        >
          Vista Diaria
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "acumulado"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-slate-400 hover:text-slate-300"
          }`}
          onClick={() => setActiveTab("acumulado")}
        >
          Acumulado
        </button>
      </div>

      {/* Gráfico */}
      <div className="h-64 mt-1">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner text="Cargando datos..." />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="dia"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickMargin={10}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
              />
              <YAxis
                tickFormatter={(value) => formatShortCurrency(value)}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{
                  color: "#e2e8f0",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                }}
                itemStyle={{
                  color: "#f8fafc",
                  fontSize: "0.875rem",
                  padding: "0.25rem 0",
                }}
                formatter={(value, name) => [formatCurrency(value), name]}
                labelFormatter={(label) => `Día ${label}`}
              />
              <Legend
                wrapperStyle={{ paddingTop: "1rem" }}
                formatter={(value) => (
                  <span className="text-slate-300 text-sm">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey={activeTab === "diario" ? "monto" : "acumulado"}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#1e40af", strokeWidth: 2 }}
                name="Actual"
              />
              {hasComparison && (
                <Line
                  type="monotone"
                  dataKey={activeTab === "diario" ? "anterior" : "acumulado"}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: "#92400e", strokeWidth: 2 }}
                  name="Año anterior"
                />
              )}
              <Line
                type="monotone"
                dataKey="promedio"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#065f46", strokeWidth: 2 }}
                name="Promedio"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

// Componente auxiliar para mostrar métricas
function MetricCard({
  title,
  value,
  formattedValue,
  icon,
  comparison,
  secondaryValue,
}) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-1 border border-slate-700 hover:border-indigo-400 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            {icon}
            <span>{title}</span>
          </p>
          <p className="text-l font-semibold mt-1">{formattedValue}</p>
          {secondaryValue && (
            <p className="text-xs text-slate-500 mt-1">{secondaryValue}</p>
          )}
        </div>
        {comparison && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              comparison.isPositive
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {comparison.isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(comparison.value).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

// Función auxiliar para formatear valores cortos
function formatShortCurrency(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}
