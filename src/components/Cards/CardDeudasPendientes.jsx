import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  User,
  Car,
  Tag,
} from "lucide-react";
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
          const deudasData = snapshot.docs.map((doc) => {
            const data = doc.data();

            // Calcular monto pendiente y días de vencimiento
            const montoPendiente =
  data.deudas?.reduce((sum, cuota) => {
    if (cuota.pagado) return sum; // Si está totalmente pagada, no suma nada

    const totalPagado = (cuota.pagos || []).reduce((pagSum, pago) => {
      return pagSum + (pago.monto || 0);
    }, 0);

    const saldoCuota = (cuota.monto || 0) - totalPagado;

    // Sumar solo si saldo > 0
    return sum + (saldoCuota > 0 ? saldoCuota : 0);
  }, 0) || 0;

            // Obtener fecha de vencimiento más próxima de los no pagados
            const fechaVencimientoProxima = data.deudas?.reduce((min, d) => {
              if (d.pagado || !d.fechaVencimiento) return min;
              const fecha =
                d.fechaVencimiento?.toDate?.() || new Date(d.fechaVencimiento);
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
              urgente: diasRestantes !== null && diasRestantes <= 3,
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

          const total = deudasData.reduce(
            (sum, deuda) => sum + deuda.montoPendiente,
            0
          );

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
      className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow border-l-4 border-red-500 min-h-80"
    >
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-lg"
            animate={{
              rotate: [0, -8, 0, 10, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          >
            <AlertTriangle className="text-yellow-400 w-5 h-5 sm:w-10 sm:h-10" />
          </motion.div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-100">
              Deudas activas
            </h3>
          </div>
        </div>
        <div className="sm:ml-auto bg-yellow-700 text-slate-100 px-3 sm:px-4 py-2 rounded-xl text-base sm:text-lg font-bold flex items-center gap-2">
          <NumericFormat
            value={totalDeuda}
            displayType="text"
            thousandSeparator="."
            decimalSeparator=","
            prefix="$"
            className="text-base sm:text-lg text-slate-200 truncate"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-6 sm:py-8">
          <div className="animate-pulse flex space-x-3 sm:space-x-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-full bg-slate-600 h-2 w-2 sm:h-3 sm:w-3"
              ></div>
            ))}
          </div>
        </div>
      )}

      {deudas.length === 0 && !loading ? (
        <div className="bg-slate-800/50 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-sm sm:text-base text-gray-300">
            No hay deudas pendientes registradas.
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          <ul className="divide-y divide-gray-700">
            <AnimatePresence>
              {paginatedDeudas.map((deuda) => {
                const deudasPendientes =
                  deuda.deudas?.filter((d) => !d.pagado) || [];
                const isExpanded = expandedDeuda === deuda.id;
                const isVencida =
                  deuda.diasRestantes !== null && deuda.diasRestantes < 0;

                return (
                  <motion.li
                    key={deuda.id}
                    className="py-3 sm:py-4 relative bg-slate-800/30 rounded-lg px-3 sm:px-4 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col gap-2">
                      {/* Encabezado de la deuda */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div
                            className={`p-1.5 sm:p-2 rounded-full ${
                              isVencida ? "bg-red-500/20" : "bg-yellow-500/20"
                            }`}
                          >
                            {isVencida ? (
                              <AlertTriangle className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <Clock className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-100 flex items-center gap-1 sm:gap-2 truncate">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              <span className="truncate">
                                {deuda.clienteNombre}
                              </span>
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-1 sm:gap-2 mt-1">
                              <p className="text-xs sm:text-sm text-gray-300 flex items-center gap-1 truncate">
                                <Car className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                <span className="truncate">
                                  {deuda.vehiculoInfo?.marca}{" "}
                                  {deuda.vehiculoInfo?.modelo}
                                </span>
                              </p>
                              {deuda.vehiculoInfo?.patente && (
                                <span className="text-2xs sm:text-xs bg-slate-700/50 text-gray-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  {deuda.vehiculoInfo.patente}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end sm:items-end ml-auto sm:ml-0">
                          <span className="text-base sm:text-lg font-bold text-lime-400 whitespace-nowrap">
                            <NumericFormat
                              value={deuda.montoPendiente}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$"
                            />
                          </span>
                          <div
                            className={`text-2xs sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full mt-1 whitespace-nowrap ${
                              isVencida
                                ? "bg-red-700 text-white"
                                : deuda.urgente
                                ? "bg-orange-600 text-white"
                                : "bg-yellow-600 text-white"
                            }`}
                          >
                            {isVencida
                              ? `Vencido hace ${Math.abs(
                                  deuda.diasRestantes
                                )} días`
                              : deuda.diasRestantes !== null
                              ? `${deuda.diasRestantes} días restantes`
                              : "Sin fecha"}
                          </div>
                        </div>
                      </div>

                      {/* Botón de detalles */}
                      <button
                        onClick={() => toggleExpandDeuda(deuda.id)}
                        className="flex items-center justify-center gap-1 text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 mt-1 sm:mt-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                            Ocultar detalles
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                            Ver detalles
                          </>
                        )}
                      </button>

                      {/* Detalles expandidos */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-700">
                              <h5 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
                                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                                Pagos pendientes
                              </h5>
                              <ul className="space-y-1 sm:space-y-2">
                             {deudasPendientes.map((d, i) => {
  const fechaVencimiento = d.fechaVencimiento
  ? typeof d.fechaVencimiento.toDate === "function"
    ? d.fechaVencimiento.toDate()
    : new Date(d.fechaVencimiento)
  : null;

  return (
    <li key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-700/30 p-1.5 sm:p-2 rounded gap-1 sm:gap-2">
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        <span className={`text-xs sm:text-sm ${isVencida ? "text-red-400" : "text-gray-300"} truncate`}>
          {d.metodo || "Método no especificado"}
        </span>
        {fechaVencimiento && (
          <span className="text-2xs sm:text-xs flex items-center gap-0.5 sm:gap-1 text-gray-400">
            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {fechaVencimiento.toLocaleDateString("es-AR")}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2">
        <span className={`text-xs sm:text-sm font-semibold ${isVencida ? "text-red-400" : "text-lime-400"} whitespace-nowrap`}>
          <NumericFormat
            value={d.monto}
            displayType="text"
            thousandSeparator="."
            decimalSeparator=","
            prefix="$"
          />
        </span>
        {isVencida && (
          <span className="text-2xs sm:text-xs bg-red-900/50 text-red-300 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded">
            Vencido
          </span>
        )}
      </div>
    </li>
  );
})}
                              </ul>

                              {deuda.notas && (
                                <div className="mt-2 sm:mt-3">
                                  <h5 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">
                                    Notas
                                  </h5>
                                  <p className="text-xs sm:text-sm text-gray-400 bg-slate-800/50 p-1.5 sm:p-2 rounded break-words">
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
            <div className="flex justify-between items-center mt-4 gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 bg-slate-700 rounded text-xs sm:text-sm disabled:opacity-50 flex-1 sm:flex-none"
              >
                Anterior
              </button>

              <span className="text-xs sm:text-sm text-gray-300 px-2 text-center">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 bg-slate-700 rounded text-xs sm:text-sm disabled:opacity-50 flex-1 sm:flex-none"
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