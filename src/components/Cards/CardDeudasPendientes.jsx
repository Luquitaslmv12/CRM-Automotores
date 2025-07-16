import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, DollarSign, ChevronDown, ChevronUp, Clock, Calendar, User, Car, Tag } from "lucide-react";
import { NumericFormat } from "react-number-format";

export default function CardDeudasPendientes() {
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDeuda, setTotalDeuda] = useState(0);
  const [expandedDeuda, setExpandedDeuda] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const cargarDeudas = async () => {
      try {
        const q = query(
          collection(db, "deudas"),
          where("estado", "in", ["Pendiente", "Parcialmente Pagado"])
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const deudasData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Calcular monto pendiente y días de vencimiento
            const montoPendiente = data.deudas?.reduce((sum, d) => {
              return d.pagado ? sum : sum + (d.monto || 0);
            }, 0) || 0;
            
            // Obtener fecha de vencimiento más próxima de los no pagados
            const fechaVencimientoProxima = data.deudas?.reduce((min, d) => {
              if (d.pagado || !d.fechaVencimiento) return min;
              const fecha = d.fechaVencimiento?.toDate?.() || new Date(d.fechaVencimiento);
              return !min || fecha < min ? fecha : min;
            }, null);
            
            // Calcular días restantes para el vencimiento
            let diasRestantes = null;
            if (fechaVencimientoProxima) {
              const diffTime = fechaVencimientoProxima - new Date();
              diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            
            return {
              id: doc.id,
              ...data,
              fechaVenta: data.fechaVenta?.toDate?.() || null,
              montoPendiente,
              fechaVencimientoProxima,
              diasRestantes,
              urgente: diasRestantes !== null && diasRestantes <= 3
            };
          });

          // Ordenar por urgencia (vencimientos próximos primero)
          deudasData.sort((a, b) => {
            // Primero las vencidas
            if (a.diasRestantes < 0 && b.diasRestantes >= 0) return -1;
            if (b.diasRestantes < 0 && a.diasRestantes >= 0) return 1;
            
            // Luego por proximidad de vencimiento
            if (a.diasRestantes !== null && b.diasRestantes !== null) {
              return a.diasRestantes - b.diasRestantes;
            }
            
            return 0;
          });

          const total = deudasData.reduce((sum, deuda) => sum + deuda.montoPendiente, 0);
          
          setDeudas(deudasData);
          setTotalDeuda(total);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error cargando deudas:", error);
        setLoading(false);
      }
    };

    cargarDeudas();
  }, []);

  // Paginación
  const totalPages = Math.ceil(deudas.length / itemsPerPage);
  const paginatedDeudas = deudas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleExpandDeuda = (id) => {
    setExpandedDeuda(expandedDeuda === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow border-l-4 border-red-500"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <AlertTriangle className="text-yellow-400 w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-100">Deudas activas</h3>
          
        </div>
        <div className="ml-auto bg-red-600 text-white px-4 py-2 rounded-xl text-lg font-bold flex items-center gap-2">
         
          <NumericFormat
            value={totalDeuda}
            displayType="text"
            thousandSeparator="."
            decimalSeparator=","
            prefix="$"
            className="text-lg text-slate-200"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-600 h-3 w-3"></div>
            <div className="rounded-full bg-slate-600 h-3 w-3"></div>
            <div className="rounded-full bg-slate-600 h-3 w-3"></div>
          </div>
        </div>
      )}

      {deudas.length === 0 && !loading ? (
        <div className="bg-slate-800/50 rounded-lg p-6 text-center">
          <p className="text-gray-300 text-base">
            No hay deudas pendientes registradas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-gray-700">
            <AnimatePresence>
              {paginatedDeudas.map((deuda) => {
                const deudasPendientes = deuda.deudas?.filter(d => !d.pagado) || [];
                const isExpanded = expandedDeuda === deuda.id;
                const isVencida = deuda.diasRestantes !== null && deuda.diasRestantes < 0;
                
                return (
                  <motion.li 
                    key={deuda.id} 
                    className="py-4 relative bg-slate-800/30 rounded-lg px-4 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${isVencida ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                            {isVencida ? (
                              <AlertTriangle className="text-red-400 w-5 h-5" />
                            ) : (
                              <Clock className="text-yellow-400 w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {deuda.clienteNombre}
                            </h4>
                            <p className="text-sm text-gray-300 flex items-center gap-2">
                              <Car className="w-4 h-4 text-gray-400" />
                              {deuda.vehiculoInfo?.marca} {deuda.vehiculoInfo?.modelo}
                            </p>
                             {deuda.vehiculoInfo?.patente && (
                                <span className="text-xs bg-slate-700/50 text-gray-300 px-2 py-1 rounded-full flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {deuda.vehiculoInfo.patente}
                                </span>
                              )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-lime-400">
                            <NumericFormat
                              value={deuda.montoPendiente}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$"
                            />
                          </span>
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 whitespace-nowrap ${
                            isVencida 
                              ? "bg-red-700 text-white" 
                              : deuda.urgente 
                                ? "bg-orange-600 text-white" 
                                : "bg-yellow-600 text-white"
                          }`}>
                            {isVencida ? (
                              `Vencido hace ${Math.abs(deuda.diasRestantes)} días`
                            ) : deuda.diasRestantes !== null ? (
                              `${deuda.diasRestantes} días restantes`
                            ) : "Sin fecha"}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleExpandDeuda(deuda.id)}
                        className="flex items-center justify-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 mt-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" /> Ocultar detalles
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" /> Ver detalles
                          </>
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Pagos pendientes
                              </h5>
                              <ul className="space-y-2">
                                {deudasPendientes.map((d, i) => {
                                  const isPagoVencido = d.fechaVencimiento && 
                                    new Date(d.fechaVencimiento) < new Date();
                                  
                                  return (
                                    <li key={i} className="flex justify-between items-center bg-slate-700/30 p-2 rounded">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm ${isPagoVencido ? 'text-red-400' : 'text-gray-300'}`}>
                                          {d.metodo || "Método no especificado"}
                                        </span>
                                        {d.fechaVencimiento && (
                                          <span className="text-xs flex items-center gap-1 text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(d.fechaVencimiento).toLocaleDateString('es-AR')}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-semibold ${isPagoVencido ? 'text-red-400' : 'text-lime-400'}`}>
                                          <NumericFormat
                                            value={d.monto}
                                            displayType="text"
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            prefix="$"
                                          />
                                        </span>
                                        {isPagoVencido && (
                                          <span className="text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">
                                            Vencido
                                          </span>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                              
                              {deuda.notas && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-semibold text-gray-300 mb-1">Notas</h5>
                                  <p className="text-sm text-gray-400 bg-slate-800/50 p-2 rounded">
                                    {deuda.notas}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-700 rounded text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              
              <span className="text-sm text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-slate-700 rounded text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}