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
          transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{
            boxShadow: "0 0 20px rgba(250, 204, 21, 0.4)", // yellow-400 glow
          }}
          className="relative w-full max-w-md p-6 rounded-2xl bg-gradient-to-br from-yellow-900/50 to-yellow-700/40 backdrop-blur-md text-white border-2 border-yellow-400 transition-shadow duration-300"
        >
          {/* Botones editar y quitar */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={onClick}
              className="text-white/60 hover:text-blue-400 transition"
              title="Editar vehículo parte de pago"
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-white/60 hover:text-red-400 transition"
              title="Quitar vehículo parte de pago"
            >
              <X size={18} />
            </button>
          </div>

          {/* Título */}
          <div className="mb-5">
            <h3 className="text-xl font-extrabold text-yellow-300 uppercase tracking-wide">
              Vehículo entregado
            </h3>
            <p className="text-sm text-white/70">Información del automóvil</p>
          </div>

          {/* Info del vehículo */}
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Car className="text-yellow-300" size={18} />
              <span className="text-base font-semibold">
                {vehiculo.marca} {vehiculo.modelo}
              </span>
            </div>

            {vehiculo.patente && (
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 text-lg">🚘</span>
                <span className="text-white/90">
                  <span className="font-medium">Patente:</span>{" "}
                  {vehiculo.patente}
                </span>
              </div>
            )}

            {vehiculo.monto && (
              <div className="flex items-center gap-2">
                <DollarSign className="text-yellow-300" size={18} />
                <span className="text-white/90">
                  <span className="font-medium">Valor tomado:</span>{" "}
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
