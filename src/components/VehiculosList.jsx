import React, { useState } from 'react';
import { LucideEdit, LucideTrash2 } from 'lucide-react';

export default function VehiculosList({ vehiculos, marcas, modelos, onEdit, onDelete }) {
  const [search, setSearch] = useState('');

  // Filtrado básico por patente o marca o modelo
  const filteredVehiculos = vehiculos.filter((v) => {
    const marca = marcas.find((m) => m.id === v.marcaId)?.nombre || '';
    const modelo = modelos.find((mo) => mo.id === v.modeloId)?.nombre || '';
    return (
      v.patente.toLowerCase().includes(search.toLowerCase()) ||
      marca.toLowerCase().includes(search.toLowerCase()) ||
      modelo.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div>
              <div className="space-y-3 max-w-3xl mx-auto">
  {vehiculos.length === 0 ? (
    <p className="text-center text-slate-400">No hay vehículos que coincidan.</p>
  ) : (
    vehiculos.map((vehiculo) => (
      <motion.div
        key={vehiculo.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-700 p-4 rounded-xl shadow-md flex justify-between items-center"
      >
        <div>
          <p className="text-lg font-semibold">
            {vehiculo.marca} {vehiculo.modelo}
          </p>
          <p className="text-sm text-slate-300">
            Patente: {vehiculo.patente || '-'} · Estado: {vehiculo.estado || '-'} · Tipo: {vehiculo.tipo || '-'}
          </p>
          {vehiculo.etiqueta && (
            <p
              className={`text-xs inline-block mt-1 px-2 py-1 rounded-full text-white ${colorEtiqueta(vehiculo.etiqueta)}`}
            >
              {vehiculo.etiqueta}
            </p>
          )}
        </div>

      
        <div className="flex gap-2">
          <button
            onClick={() => editarVehiculo(vehiculo)}
            className="text-indigo-300 hover:text-indigo-500"
            aria-label="Editar vehículo"
          >
            <Pencil />
          </button>
          <button
            onClick={() => eliminarVehiculo(vehiculo.id)}
            className="text-red-400 hover:text-red-600"
            aria-label="Eliminar vehículo"
          >
            <Trash2 />
          </button>
        </div>
      </motion.div>
    ))
  )}
</div>

      <div className="max-w-3xl mx-auto flex justify-between items-center mt-4 text-indigo-300 select-none">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pagina === 1}
          className="px-3 py-1 rounded bg-indigo-700 disabled:bg-indigo-900"
          aria-label="Página anterior"
        >
          &lt; Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas || 1}
        </span>
        <button
          onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          disabled={pagina === totalPaginas || totalPaginas === 0}
          className="px-3 py-1 rounded bg-indigo-700 disabled:bg-indigo-900"
          aria-label="Página siguiente"
        >
          Siguiente &gt;
        </button>
      </div>
      </div>
  );
}