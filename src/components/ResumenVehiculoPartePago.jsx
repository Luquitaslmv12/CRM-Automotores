import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Calendar, Palette, DollarSign } from "lucide-react";

export default function ResumenVehiculoPartePago({ vehiculo, onRemove }) {
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
          className="relative bg-gradient-to-br from-zinc-400 to-zinc-700  backdrop-blur-sm text-slate-800 rounded-2xl p-6 w-full border border-indigo-100 transition-all duration-300"
        >
          {/* Botón quitar */}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition"
            title="Quitar vehículo parte de pago"
          >
            <X size={20} />
          </button>

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

            {vehiculo.anio && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-inner">
                  <Calendar size={16} />
                </div>
                <span className="text-slate-700">
                  <span className="font-medium">Año:</span> {vehiculo.anio}
                </span>
              </div>
            )}

            {vehiculo.color && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-inner">
                  <Palette size={16} />
                </div>
                <span className="text-slate-700">
                  <span className="font-medium">Color:</span> {vehiculo.color}
                </span>
              </div>
            )}

            {vehiculo.montoReferencial && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-inner">
                  <DollarSign size={16} />
                </div>
                <span className="text-slate-700">
                  <span className="font-medium">Monto referencial:</span> $
                  {vehiculo.montoReferencial.toLocaleString("es-AR")}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
