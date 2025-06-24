import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Phone, User } from "lucide-react";

export default function ResumenCliente({ cliente, onRemove }) {
  return (
    <AnimatePresence>
      {cliente && (
        <motion.div
          key={cliente.email || cliente.nombre}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.015 }}
          className="relative bg-gradient-to-br from-zinc-400 to-zinc-700  backdrop-blur-sm text-slate-800 rounded-2xl p-6 w-full border border-indigo-100 transition-all duration-300"
        >
          {/* Botón de cerrar */}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition cursor-pointer"
            title="Quitar cliente"
          >
            <X size={20} />
          </button>

          {/* Título */}
          <div className="mb-4 flex items-center gap-2">
            <User className="text-indigo-500" size={20} />
            <h3 className="text-lg font-semibold text-indigo-600 uppercase tracking-wide">
              Cliente seleccionado
            </h3>
          </div>

          {/* Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                <User size={16} />
              </div>
              <span className="font-semibold text-base">
                {cliente.nombre || "Sin nombre"}
              </span>
            </div>

            {cliente.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Mail size={16} />
                </div>
                <span>{cliente.email}</span>
              </div>
            )}

            {cliente.telefono && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Phone size={16} />
                </div>
                <span>{cliente.telefono}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
