import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Car,
  Calendar,
  Wrench,
  DollarSign,
  AlertTriangle,
  Tag,
} from "lucide-react";

export default function EstadoCuentaModal({
  abierto,
  onClose,
  reparaciones,
  vehiculos,
}) {
  const reparacionesFiltradas = reparaciones.filter((r) => r.saldo > 0);
  const total = reparacionesFiltradas.reduce((acc, r) => acc + r.saldo, 0);

  function formatearFecha(fechaFirestore) {
    if (!fechaFirestore) return "Sin fecha";
    const fecha = fechaFirestore.toDate
      ? fechaFirestore.toDate()
      : new Date(fechaFirestore);
    return fecha.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const formatoPesoArg = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });

  const obtenerVehiculo = (vehiculoId) =>
    vehiculos?.find((v) => v.id === vehiculoId) || {};

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-900 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl relative border border-gray-800"
          >
            {/* Encabezado */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="text-lime-500" />
                  Estado de Cuenta
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Detalle de reparaciones pendientes de pago
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-red-500 transition-colors" />
              </button>
            </div>

            {/* Lista de reparaciones */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {reparacionesFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="w-10 h-10 text-yellow-400 mb-3" />
                  <h3 className="text-lg font-medium text-white">
                    No hay reparaciones pendientes
                  </h3>
                  <p className="text-gray-400 mt-1">
                    Todas las reparaciones están al día
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {reparacionesFiltradas.map((r) => {
                    const vehiculo = obtenerVehiculo(r.vehiculoId);
                    const fechaVencimiento = r.fechaVencimiento
                      ? r.fechaVencimiento.toDate
                        ? r.fechaVencimiento.toDate()
                        : new Date(r.fechaVencimiento)
                      : null;
                    const estaVencido =
                      fechaVencimiento && fechaVencimiento < new Date();

                    return (
                      <motion.li
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-800/50 p-4 rounded-xl border border-gray-700"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Columna izquierda */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-6 h-6 text-gray-400" />
                              <span className="font-medium text-white">
                                {r.descripcionReparacion ||
                                  "Reparación no especificada"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">
                                {formatearFecha(r.creadoEn)}
                              </span>
                              {fechaVencimiento && (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    estaVencido
                                      ? "bg-red-900/30 text-red-400"
                                      : "bg-blue-900/30 text-blue-400"
                                  }`}
                                >
                                  {estaVencido ? "Vencido" : "Vence"}{" "}
                                  {formatearFecha(fechaVencimiento)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Columna derecha */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-sm text-white">
                                  {vehiculo.marca || "—"}{" "}
                                  {vehiculo.modelo || ""}
                                </span>
                                {r.patenteVehiculo && (
                                  <span className="ml-2 text-s bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {r.patenteVehiculo}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">
                                Saldo pendiente:
                              </span>
                              <span
                                className={`text-lg font-semibold ${
                                  estaVencido
                                    ? "text-red-400"
                                    : "text-indigo-400"
                                }`}
                              >
                                {formatoPesoArg.format(r.saldo)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Total y botón */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-white">
                  Total adeudado:
                </span>
                <span className="text-2xl font-bold text-indigo-400">
                  {formatoPesoArg.format(total)}
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
              >
                Cerrar estado de cuenta
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
