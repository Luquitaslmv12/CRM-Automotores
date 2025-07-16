import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, DollarSign, ChevronDown, ChevronUp, Clock, Calendar, User, Car, Skull, Tag } from "lucide-react";
import { NumericFormat } from "react-number-format";

export default function CardDeudasVencidas() {
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDeuda, setTotalDeuda] = useState(0);
  const [expandedDeuda, setExpandedDeuda] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
            
            // Filtrar solo los pagos vencidos
            const deudasVencidas = data.deudas?.filter(d => {
              if (d.pagado) return false;
              if (!d.fechaVencimiento) return false;
              const fechaVencimiento = d.fechaVencimiento?.toDate?.() || new Date(d.fechaVencimiento);
              return fechaVencimiento < new Date();
            }) || [];
            
            if (deudasVencidas.length === 0) return null;

            // Calcular monto pendiente vencido
            const montoVencido = deudasVencidas.reduce((sum, d) => sum + (d.monto || 0), 0);
            
            // Obtener fecha de vencimiento más antigua
            const fechaVencimientoMasAntigua = deudasVencidas.reduce((min, d) => {
              const fecha = d.fechaVencimiento?.toDate?.() || new Date(d.fechaVencimiento);
              return !min || fecha < min ? fecha : min;
            }, null);
            
            // Calcular días de vencimiento
            let diasVencido = null;
            if (fechaVencimientoMasAntigua) {
              const diffTime = new Date() - fechaVencimientoMasAntigua;
              diasVencido = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
            
            return {
              id: doc.id,
              ...data,
              fechaVenta: data.fechaVenta?.toDate?.() || null,
              montoVencido,
              fechaVencimientoMasAntigua,
              diasVencido,
              deudasVencidas,
              muyVencida: diasVencido !== null && diasVencido > 15 // Más de 15 días vencida
            };
          }).filter(Boolean); // Filtrar nulos

          // Ordenar por las más vencidas primero
          deudasData.sort((a, b) => b.diasVencido - a.diasVencido);

          const total = deudasData.reduce((sum, deuda) => sum + deuda.montoVencido, 0);
          
          setDeudas(deudasData);
          setTotalDeuda(total);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error cargando deudas vencidas:", error);
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
      className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow border-l-4 border-red-700"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-red-500/30 rounded-lg">
          <AlertTriangle className="text-red-500 w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-100">Deudas vencidas</h3>
          <p className="text-sm text-gray-300">Pagos atrasados</p>
        </div>
        <div className="ml-auto bg-red-700 text-white px-4 py-2 rounded-xl text-lg font-bold flex items-center gap-2">
         
          <NumericFormat
            value={totalDeuda}
            displayType="text"
            thousandSeparator="."
            decimalSeparator=","
            prefix="$"
            className="text-lg"
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
            ¡Excelente! No hay deudas vencidas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-gray-700">
            <AnimatePresence>
              {paginatedDeudas.map((deuda) => {
                const isExpanded = expandedDeuda === deuda.id;
                
                return (
                  <motion.li 
                    key={deuda.id} 
                    className={`py-4 relative rounded-lg px-4 mb-2 ${deuda.muyVencida ? 'bg-red-900/20' : 'bg-red-800/10'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${deuda.muyVencida ? 'bg-red-700/30' : 'bg-red-600/30'}`}>
                            <AlertTriangle className="text-red-400 w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {deuda.clienteNombre}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
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
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-red-400">
                            <NumericFormat
                              value={deuda.montoVencido}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$"
                            />
                          </span>
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 whitespace-nowrap ${
                            deuda.muyVencida ? "bg-red-800 text-white" : "bg-red-700 text-white"
                          }`}>
                            {deuda.diasVencido !== null ? (
                              `Vencida hace ${deuda.diasVencido} días`
                            ) : "Fecha no disponible"}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleExpandDeuda(deuda.id)}
                        className="flex items-center justify-center gap-1 text-sm text-red-400 hover:text-red-300 mt-2"
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
                            <div className="mt-3 pt-3 border-t border-red-900/50">
                             

                              <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                Pagos vencidos
                              </h5>
                              <ul className="space-y-2">
                                {deuda.deudasVencidas.map((d, i) => {
                                  const fechaVencimiento = d.fechaVencimiento?.toDate?.() || new Date(d.fechaVencimiento);
                                  const diasVencido = Math.floor((new Date() - fechaVencimiento) / (1000 * 60 * 60 * 24));
                                  
                                  return (
                                    <li key={i} className="flex justify-between items-center bg-red-900/20 p-2 rounded">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-red-300">
                                          {d.metodo || "Método no especificado"}
                                        </span>
                                        <span className="text-xs flex items-center gap-1 text-red-400">
                                          <Calendar className="w-3 h-3" />
                                          {fechaVencimiento.toLocaleDateString('es-AR')}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-red-300">
                                          <NumericFormat
                                            value={d.monto}
                                            displayType="text"
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            prefix="$"
                                          />
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                          diasVencido > 15 ? "bg-red-900 text-red-200" : "bg-red-800/50 text-red-300"
                                        }`}>
                                          {diasVencido} días
                                        </span>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                              
                              {deuda.notas && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-semibold text-gray-300 mb-1">Notas</h5>
                                  <p className="text-sm text-gray-400 bg-red-900/10 p-2 rounded">
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