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
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, FileDown } from "lucide-react";
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
      const qActual = query(
        ventasRef,
        where("fecha", ">=", desde),
        where("fecha", "<", hasta)
      );
      const qAnterior = query(
        ventasRef,
        where("fecha", ">=", desdeAnt),
        where("fecha", "<", hastaAnt)
      );

      const snapActual = await getDocs(qActual);
      const snapAnterior = await getDocs(qAnterior);

      // Data actual
      const totales = labels.map((dia) => ({
        dia,
        monto: 0,
        acumulado: 0,
        anterior: 0,
        promedio: 0,
      }));

      snapActual.forEach((doc) => {
        const { fecha, monto } = doc.data();
        if (fecha?.toDate && monto) {
          const day = fecha.toDate().getDate();
          if (totales[day - 1]) totales[day - 1].monto += monto;
        }
      });

      // Acumulado actual
      totales.reduce((acc, curr) => {
        curr.acumulado = acc + curr.monto;
        return curr.acumulado;
      }, 0);

      // Año anterior
      snapAnterior.forEach((doc) => {
        const { fecha, monto } = doc.data();
        if (fecha?.toDate && monto) {
          const day = fecha.toDate().getDate();
          if (totales[day - 1]) totales[day - 1].anterior += monto;
        }
      });

      if (snapAnterior.size > 0) {
        setHasComparison(true);
      }

      // Calcular promedio diario de últimos 3 meses
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
      const q = query(
        ventasRef,
        where("fecha", ">=", f.from),
        where("fecha", "<", f.to)
      );
      const snap = await getDocs(q);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow flex flex-col gap-4 border-l-4 border-blue-500"
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Evolución de Ventas</h3>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-2 py-1 rounded border bg-gray-700"
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
            className="px-2 py-1 rounded border bg-gray-700"
          >
           {Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - 2 + i;
  return <option key={year} value={year}>{year}</option>;
})}
          </select>
          <button
            onClick={exportarExcel}
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          >
            <FileDown className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-300 mt-2">
  <div>
    <div className="font-semibold text-blue-400">Total Actual</div>
    <div>{formatCurrency(data.reduce((a, b) => a + b.monto, 0))}</div>
  </div>
  <div>
    <div className="font-semibold text-yellow-400">Total Año Anterior</div>
    <div>{formatCurrency(data.reduce((a, b) => a + b.anterior, 0))}</div>
  </div>
  <div>
    <div className="font-semibold text-green-400">Promedio Diario</div>
    <div>{formatCurrency(data.reduce((a, b) => a + b.promedio, 0) / data.length)}</div>
  </div>
  <div>
    <div className="font-semibold text-purple-400">Días con Ventas</div>
    <div>{data.filter(d => d.monto > 0).length} días</div>
  </div>
</div>


{loading ? (
  <Spinner text="Cargando ventas..." />
) : (

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="dia" />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f293724",
              border: "none",
              borderRadius: 6,
            }}
            labelStyle={{ color: "#b6eb54" }}
            itemStyle={{ color: "#f3f4f6", fontSize: 13 }}
            formatter={(v, name) => [formatCurrency(v), name]}
          />
          <Line
            type="monotone"
            dataKey="monto"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Actual"
          />
          <Line
            type="monotone"
            dataKey="anterior"
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            name="Año anterior"
          />
          <Line
            type="monotone"
            dataKey="promedio"
            stroke="#10b981"
            strokeDasharray="3 3"
            strokeWidth={2}
            dot={false}
            name="Promedio"
          />
        </LineChart>
      </ResponsiveContainer>

      )}
    </motion.div>
    
  );
}
