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
  Skull,
  Tag,
} from "lucide-react";
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
          const deudasData = snapshot.docs
            .map((doc) => {
              const data = doc.data();

              // Filtrar solo los pagos vencidos
              const deudasVencidas =
                data.deudas?.filter((d) => {
                  if (d.pagado) return false;
                  if (!d.fechaVencimiento) return false;
                  const fechaVencimiento =
                    d.fechaVencimiento?.toDate?.() ||
                    new Date(d.fechaVencimiento);
                  return fechaVencimiento < new Date();
                }) || [];

              if (deudasVencidas.length === 0) return null;

              // Calcular monto pendiente vencido
              const montoVencido = deudasVencidas.reduce(
                (sum, d) => sum + (d.monto || 0),
                0
              );

              // Obtener fecha de vencimiento más antigua
              const fechaVencimientoMasAntigua = deudasVencidas.reduce(
                (min, d) => {
                  const fecha =
                    d.fechaVencimiento?.toDate?.() ||
                    new Date(d.fechaVencimiento);
                  return !min || fecha < min ? fecha : min;
                },
                null
              );

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
                muyVencida: diasVencido !== null && diasVencido > 15, // Más de 15 días vencida
              };
            })
            .filter(Boolean); // Filtrar nulos

          // Ordenar por las más vencidas primero
          deudasData.sort((a, b) => b.diasVencido - a.diasVencido);

          const total = deudasData.reduce(
            (sum, deuda) => sum + deuda.montoVencido,
            0
          );

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
      className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow border-l-4 border-red-700 min-h-120"
    >
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg relative">
            <AlertTriangle className="text-red-700 w-5 h-5 sm:w-10 sm:h-10 " />
            <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-100">
              Deudas vencidas
            </h3>
            <p className="text-xs sm:text-sm text-gray-300">Pagos atrasados</p>
          </div>
        </div>
        <div className="sm:ml-auto bg-red-700 text-white px-3 py-2 rounded-xl text-base sm:text-lg font-bold flex items-center justify-between gap-2">
          <NumericFormat
            value={totalDeuda}
            displayType="text"
            thousandSeparator="."
            decimalSeparator=","
            prefix="$"
            className="text-base sm:text-lg truncate"
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

      {deudas.length > 0 && !loading && (
        <div className="space-y-3">
          <ul className="divide-y divide-gray-700">
            <AnimatePresence>
              {paginatedDeudas.map((deuda) => {
                const isExpanded = expandedDeuda === deuda.id;

                return (
                  <motion.li
                    key={deuda.id}
                    className={`py-3 sm:py-4 relative rounded-lg px-3 sm:px-4 mb-2 ${
                      deuda.muyVencida ? "bg-red-900/20" : "bg-red-800/10"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col gap-2">
                      {/* Encabezado de la deuda - ajustado para móvil */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-1 sm:p-2 rounded-full ${
                              deuda.muyVencida
                                ? "bg-red-700/30"
                                : "bg-red-600/30"
                            }`}
                          >
                            <AlertTriangle className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-100 flex items-center gap-2 truncate">
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
                                <span className="text-xs bg-slate-700/50 text-gray-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  {deuda.vehiculoInfo.patente}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end sm:items-end ml-auto sm:ml-0">
                          <span className="text-base sm:text-lg font-bold text-red-400 whitespace-nowrap">
                            <NumericFormat
                              value={deuda.montoVencido}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$"
                            />
                          </span>
                          <div
                            className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 whitespace-nowrap ${
                              deuda.muyVencida
                                ? "bg-red-800 text-white"
                                : "bg-red-700 text-white"
                            }`}
                          >
                            {deuda.diasVencido !== null
                              ? `Vencida hace ${deuda.diasVencido} días`
                              : "Fecha no disponible"}
                          </div>
                        </div>
                      </div>

                      {/* Botón de detalles */}
                      <button
                        onClick={() => toggleExpandDeuda(deuda.id)}
                        className="flex items-center justify-center gap-1 text-xs sm:text-sm text-red-400 hover:text-red-300 mt-1 sm:mt-2"
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

                      {/* Detalles expandidos - mejorado para móvil */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-red-900/50">
                              <h5 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
                                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                                Pagos vencidos
                              </h5>
                              <ul className="space-y-1 sm:space-y-2">
                                {deuda.deudasVencidas.map((d, i) => {
                                  const fechaVencimiento =
                                    d.fechaVencimiento?.toDate?.() ||
                                    new Date(d.fechaVencimiento);
                                  const diasVencido = Math.floor(
                                    (new Date() - fechaVencimiento) /
                                      (1000 * 60 * 60 * 24)
                                  );

                                  return (
                                    <li
                                      key={i}
                                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-red-900/20 p-1.5 sm:p-2 rounded gap-1 sm:gap-2"
                                    >
                                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                        <span className="text-xs sm:text-sm text-red-300 truncate">
                                          {d.metodo || "Método no especificado"}
                                        </span>
                                        <span className="text-2xs sm:text-xs flex items-center gap-0.5 sm:gap-1 text-red-400">
                                          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                          {fechaVencimiento.toLocaleDateString(
                                            "es-AR"
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2">
                                        <span className="text-xs sm:text-sm font-semibold text-red-300 whitespace-nowrap">
                                          <NumericFormat
                                            value={d.monto}
                                            displayType="text"
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            prefix="$"
                                          />
                                        </span>
                                        <span
                                          className={`text-2xs sm:text-xs px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded ${
                                            diasVencido > 15
                                              ? "bg-red-900 text-red-200"
                                              : "bg-red-800/50 text-red-300"
                                          }`}
                                        >
                                          {diasVencido} días
                                        </span>
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
                                  <p className="text-xs sm:text-sm text-gray-400 bg-red-900/10 p-1.5 sm:p-2 rounded break-words">
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

          {/* Paginación - ajustada para móvil */}
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
