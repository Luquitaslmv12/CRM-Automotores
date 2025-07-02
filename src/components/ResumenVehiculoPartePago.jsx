import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Calendar, Palette, DollarSign, Pencil } from "lucide-react";

export default function ResumenVehiculoPartePago({
  vehiculo,
  onRemove,
  onClick,
}) {
  return (
    <AnimatePresence>
      {vehiculo && (
        <motion.div
          key={vehiculo.patente}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.015 }}
          className="relative bg-gradient-to-br from-zinc-400/20 to-gray-400/90 border-3 backdrop-blur-sm text-slate-800 rounded-2xl p-6 w-full border border-indigo-500 transition-all duration-300"
        >
          {/* Botón quitar */}
          <div className="absolute top-3 right-3 flex gap-2">
            {/* Botón editar */}
            <button
              type="button"
              onClick={onClick}
              className="text-blue-400 hover:text-blue-600 transition"
              title="Editar vehículo parte de pago"
            >
              <Pencil size={20} />
            </button>

            {/* Botón quitar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-red-400 hover:text-red-600 transition"
              title="Quitar vehículo parte de pago"
            >
              <X size={20} />
            </button>
          </div>

          {/* Título */}
          <div className="mb-4 flex items-center gap-2">
            <Car className="text-yellow-300" size={20} />
            <h3 className="text-lg font-semibold text-yellow-300 uppercase tracking-wide">
              Vehículo Que Entrega
            </h3>
          </div>

          {/* Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-inner">
                <Car size={16} />
              </div>
              <span className="font-semibold text-base">
                {vehiculo.marca} {vehiculo.modelo}
              </span>
            </div>

            {vehiculo.patente && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-inner">
                  🚘
                </div>
                <span className="text-slate-700">
                  <span className="font-medium">Patente:</span>{" "}
                  {vehiculo.patente}
                </span>
              </div>
            )}

            {vehiculo.monto && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-inner">
                  <DollarSign size={16} />
                </div>
                <span className="text-slate-700">
                  <span className="font-medium">Precio:</span> $
                  {vehiculo.monto.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
