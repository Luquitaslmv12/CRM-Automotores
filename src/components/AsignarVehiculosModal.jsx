import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { LoaderCircle } from 'lucide-react';

export default function AsignarVehiculosModal({
  clienteSeleccionado,
  setClienteSeleccionado,
  vehiculosDisponibles,
  setVehiculosDisponibles,
  vehiculosAsignados,
  setVehiculosAsignados,
  asignarVehiculos,
  vehiculosSeleccionados,
  setVehiculosSeleccionados,
  vehiculoEnConfirmacion,
  setVehiculoEnConfirmacion,
  quitarVehiculoAsignado,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingQuitar, setLoadingQuitar] = useState(null); // id del vehículo que está quitando o null

  const vehiculosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    return vehiculosDisponibles.filter(
      (v) =>
        v.marca.toLowerCase().includes(term) ||
        v.modelo.toLowerCase().includes(term) ||
        v.patente.toLowerCase().includes(term)
    );
  }, [vehiculosDisponibles, busqueda]);

  const handleAsignarVehiculos = async () => {
    setLoading(true);
    try {
      await asignarVehiculos();
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para quitar vehículo con loadingQuitar
  const handleQuitarVehiculoAsignado = async (vehiculoId) => {
    setLoadingQuitar(vehiculoId);
    try {
      await quitarVehiculoAsignado(vehiculoId);
      setVehiculoEnConfirmacion(null); // cerrar confirmación después de quitar
    } finally {
      setLoadingQuitar(null);
    }
  };

  const isDisabled = loading || loadingQuitar !== null;

  return (
    <AnimatePresence>
      {clienteSeleccionado && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="relative bg-slate-900 text-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto"
          >
            {/* Overlay loading general */}
            {(loading || loadingQuitar !== null) && (
              <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center rounded-2xl z-50">
                <LoaderCircle className="animate-spin" size={48} />
                <p className="mt-3 text-white text-lg">
                  {loading ? 'Cargando...' : 'Quitando vehículo...'}
                </p>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
              <h2 className="text-2xl font-semibold">
                Asignar vehículos a{' '}
                <span className="text-indigo-400">
  {clienteSeleccionado.nombre} {clienteSeleccionado.apellido ?? ''}
</span>
              </h2>
              <button
                onClick={() => setClienteSeleccionado(null)}
                disabled={isDisabled}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Vehículos asignados */}
            {vehiculosAsignados.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-green-300 mb-2">
                  Vehículos ya asignados
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {vehiculosAsignados.map((v) => (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-slate-800 rounded-lg px-4 py-3 text-sm border border-slate-700 flex items-center justify-between"
                      >
                        <span>
                          {v.marca} {v.modelo} ·{' '}
                          <span className="text-indigo-300 font-bold">{v.patente}</span>
                        </span>

                        {vehiculoEnConfirmacion === v.id ? (
                          <AnimatePresence mode="wait">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="flex gap-2 text-xs"
                            >
                              <button
                                onClick={() => handleQuitarVehiculoAsignado(v.id)}
                                disabled={isDisabled}
                                className="text-red-400 hover:text-red-500 font-medium flex items-center gap-1"
                              >
                                {loadingQuitar === v.id ? (
                                  <>
                                    <LoaderCircle className="animate-spin" size={14} />
                                    Confirmar
                                  </>
                                ) : (
                                  'Confirmar'
                                )}
                              </button>
                              <button
                                onClick={() => setVehiculoEnConfirmacion(null)}
                                disabled={isDisabled}
                                className="text-slate-400 hover:text-slate-300"
                              >
                                Cancelar
                              </button>
                            </motion.div>
                          </AnimatePresence>
                        ) : (
                          <button
                            onClick={() => setVehiculoEnConfirmacion(v.id)}
                            disabled={isDisabled}
                            className="text-red-400 hover:text-red-500 text-xs font-medium"
                          >
                            Quitar
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Vehículos disponibles con búsqueda */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-yellow-400 mb-2">
                Vehículos disponibles
              </p>
              <input
                type="text"
                placeholder="Buscar por marca, modelo o patente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                disabled={isDisabled}
                className="w-full mb-3 px-3 py-2 text-sm rounded-lg bg-slate-800 border border-slate-700 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                <AnimatePresence>
                  {vehiculosFiltrados.length === 0 ? (
                    <motion.li
                      key="no-disponibles"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-slate-500 text-sm"
                    >
                      No hay vehículos disponibles
                    </motion.li>
                  ) : (
                    vehiculosFiltrados.map((v) => (
                      <motion.li
                        key={v.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm  hover:bg-slate-700 transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="accent-indigo-500 cursor-pointer"
                          checked={vehiculosSeleccionados.includes(v.id)}
                          onChange={(e) => {
                            const seleccionados = [...vehiculosSeleccionados];
                            if (e.target.checked) {
                              seleccionados.push(v.id);
                            } else {
                              const i = seleccionados.indexOf(v.id);
                              if (i > -1) seleccionados.splice(i, 1);
                            }
                            setVehiculosSeleccionados(seleccionados);
                          }}
                          disabled={isDisabled}
                        />
                        <span className="flex-1">
                          {v.marca} {v.modelo} ·{' '}
                          <span className="text-indigo-300 font-bold">{v.patente}</span>
                        </span>
                      </motion.li>
                    ))
                  )}
                </AnimatePresence>
              </ul>
            </div>

            {/* Botón asignar */}
            <button
              onClick={handleAsignarVehiculos}
              disabled={vehiculosSeleccionados.length === 0 || isDisabled}
              className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <LoaderCircle className="animate-spin" size={20} />
                  Cargando...
                </div>
              ) : (
                'Asignar seleccionados'
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
