import { useState } from "react";

export default function ListaMovimientos({ movimientos }) {
  const [pagina, setPagina] = useState(1);
  const ITEMS_POR_PAGINA = 5;

  const totalPaginas = Math.ceil(movimientos.length / ITEMS_POR_PAGINA);

  const movimientosPagina = movimientos.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  );

  return (
    <div>
      <div className="space-y-3">
        {movimientosPagina.map((m) => (
          <div
            key={m.id}
            className={`p-4 rounded shadow ${
              m.tipo === "ingreso" ? "bg-green-700" : "bg-red-700"
            } text-white flex justify-between items-center`}
          >
            <div>
              <p className="font-semibold">
                {m.tipo === "ingreso" ? "➕" : "➖"} ${m.monto.toLocaleString()}
              </p>
              <p>{m.descripcion}</p>
              <p className="text-sm opacity-70">
                {m.categoria || "Sin categoría"} ·{" "}
                {new Date(m.fecha.seconds * 1000).toLocaleString()}
              </p>
              <p className="text-xs italic opacity-60">Creado por: {m.creadoPor}</p>
            </div>
          </div>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            disabled={pagina === 1}
            onClick={() => setPagina((p) => Math.max(p - 1, 1))}
            className="p-2 rounded bg-gray-600 disabled:opacity-40"
          >
            ←
          </button>
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <button
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
            className="p-2 rounded bg-gray-600 disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
