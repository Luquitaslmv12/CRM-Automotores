import { AnimatePresence, motion } from "framer-motion";
import { X, BookCheck, Phone, User } from "lucide-react";

export default function ResumenCliente({ cliente, onRemove }) {
  return (
    <AnimatePresence>
      {cliente && (
        <motion.div
          key={cliente.email || cliente.nombre}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{
            boxShadow: "0 0 20px rgba(34, 211, 238, 0.4)",
          }}
          className="relative w-full max-w-md p-6 rounded-2xl bg-gradient-to-br from-sky-900/60 to-blue-700/40 backdrop-blur-lg text-white border-2 border-cyan-400 shadow-cyan-500/20 transition-shadow duration-300"
        >
          {/* Botón de cerrar */}
          <button
            type="button"
            onClick={onRemove}
            title="Quitar cliente"
            className="absolute top-3 right-3 text-white/70 hover:text-red-400 transition"
          >
            <X size={18} />
          </button>

          {/* Encabezado */}
          <div className="mb-5">
            <h3 className="text-xl font-extrabold text-cyan-300 uppercase tracking-wide">
              Cliente seleccionado
            </h3>
            <p className="text-sm text-white/70">Información detallada</p>
          </div>

          <div className="space-y-5 text-sm">
            {/* Nombre */}
            <div className="flex items-center gap-2">
              <User className="text-cyan-300" size={18} />
              <span className="text-base font-semibold">
                {cliente.nombre || "Sin nombre"} {cliente.apellido || ""}
              </span>
            </div>

            {/* DNI */}
            {cliente.dni && (
              <div className="flex items-center gap-2">
                <BookCheck className="text-cyan-300" size={18} />
                <span className="text-white/90">{cliente.dni}</span>
              </div>
            )}

            {/* Teléfono */}
            {cliente.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="text-cyan-300" size={18} />
                <span className="text-white/90">{cliente.telefono}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
