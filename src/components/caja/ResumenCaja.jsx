// ResumenCaja.jsx
export default function ResumenCaja({ movimientos }) {
  const ingresos = movimientos.filter(m => m.tipo === "ingreso");
  const egresos = movimientos.filter(m => m.tipo === "egreso");

  const totalIngresos = ingresos.reduce((sum, m) => sum + m.monto, 0);
  const totalEgresos = egresos.reduce((sum, m) => sum + m.monto, 0);
  const saldo = totalIngresos - totalEgresos;

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-green-600 p-6 rounded-lg shadow text-white">
        <p className="text-lg font-semibold">Ingresos</p>
        <p className="text-3xl font-bold">${totalIngresos.toLocaleString()}</p>
      </div>
      <div className="bg-red-600 p-6 rounded-lg shadow text-white">
        <p className="text-lg font-semibold">Egresos</p>
        <p className="text-3xl font-bold">${totalEgresos.toLocaleString()}</p>
      </div>
      <div className={`p-6 rounded-lg shadow text-white ${saldo >= 0 ? "bg-blue-600" : "bg-yellow-700"}`}>
        <p className="text-lg font-semibold">Saldo</p>
        <p className="text-3xl font-bold">${saldo.toLocaleString()}</p>
      </div>
    </div>
  );
}
