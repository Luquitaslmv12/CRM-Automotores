import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function ResumenCliente({ cliente, onRemove }) {
  return (
    <AnimatePresence>
      {cliente && (
        <motion.div
          key={cliente.email || cliente.nombre}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(99, 102, 241, 0.2)" }}
          className="relative bg-gradient-to-br from-indigo-50 to-white text-slate-800 rounded-2xl shadow-xl p-5 w-full transition-transform"
        >
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition"
            title="Quitar cliente"
            aria-label="Quitar cliente seleccionado"
          >
            <X size={20} />
          </button>

          <div className="mb-3">
            <h3 className="text-base font-semibold text-indigo-700 uppercase tracking-wide mb-1">
              Cliente seleccionado
            </h3>
            <p className="text-xl font-bold">{cliente.nombre || "Sin nombre"}</p>
          </div>

          {cliente.email && (
            <p className="text-sm text-slate-600">
              📧 <span className="ml-1 font-medium">Email:</span> {cliente.email}
            </p>
          )}
          {cliente.telefono && (
            <p className="text-sm text-slate-600 mt-1">
              📞 <span className="ml-1 font-medium">Teléfono:</span> {cliente.telefono}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
