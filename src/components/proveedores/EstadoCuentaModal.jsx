import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function sEstadoCuentaModal({ abierto, onClose, reparaciones }) {
  const reparacionesFiltradas = reparaciones.filter(r => r.saldo > 0);
  const total = reparacionesFiltradas.reduce((acc, r) => acc + r.saldo, 0);
  
  function formatearFecha(fechaFirestore) {
  if (!fechaFirestore) return "Sin fecha";

  // Firestore Timestamp tiene método toDate()
  const fecha = fechaFirestore.toDate ? fechaFirestore.toDate() : new Date(fechaFirestore);

  return fecha.toLocaleDateString(); // Puedes personalizar formato
}

const formatoPesoArg = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-lg shadow-xl relative"
          >
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Estado de Cuenta
            </h2>

            <ul className="max-h-60 overflow-auto space-y-3">
              {reparacionesFiltradas.map((r) => (
                <li key={r.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                    <p className="text-gray-700 dark:text-gray-300">
  <strong>Fecha:</strong> {formatearFecha(r.creadoEn)}
</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Reparación:</strong> {r.descripcionReparacion}
                  </p>
                  <p className="text-green-600 dark:text-green-400">
  <strong>Precio total:</strong> {formatoPesoArg.format(r.saldo)}
</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Dominio:</strong> {r.patenteVehiculo}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 font-semibold text-indigo-400">
              Total acumulado: {formatoPesoArg.format(total)}.-
            </div>

            <button
              onClick={onClose}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl w-full transition-colors"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
