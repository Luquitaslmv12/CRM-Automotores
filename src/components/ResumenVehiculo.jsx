import { AnimatePresence, motion } from "framer-motion";
import { X, Car, Calendar, Palette, DollarSign } from "lucide-react";

export default function ResumenVehiculo({ vehiculo, onRemove }) {
  return (
    <AnimatePresence>
      {vehiculo && (
        <motion.div
          key={vehiculo.id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{
            boxShadow: "0 0 20px rgba(132, 204, 22, 0.4)", // lime-400 glow
          }}
          className="relative w-full max-w-md p-6 rounded-2xl bg-gradient-to-br from-lime-900/60 to-lime-700/40 backdrop-blur-lg text-white border-2 border-lime-400 shadow-lime-400/20 transition-shadow duration-300"
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onRemove}
            title="Quitar vehículo"
            className="absolute top-3 right-3 text-white/70 hover:text-red-400 transition"
          >
            <X size={18} />
          </button>

          {/* Título */}
          <div className="mb-5">
            <h3 className="text-xl font-extrabold text-lime-300 uppercase tracking-wide">
              Vehículo en venta
            </h3>
            <p className="text-sm text-white/70">Información del automóvil</p>
          </div>

          {/* Info del vehículo */}
          <div className="space-y-5 text-sm">
            {/* Marca y modelo */}
            <div className="flex items-center gap-2">
              <Car className="text-lime-300" size={18} />
              <span className="text-base font-semibold">
                {vehiculo.marca} {vehiculo.modelo}
              </span>
            </div>

            {/* Patente */}
            {vehiculo.patente && (
              <div className="flex items-center gap-2">
                <span className="text-lime-300 text-lg">🚘</span>
                <span className="text-white/90">
                  <span className="font-medium">Patente:</span>{" "}
                  {vehiculo.patente}
                </span>
              </div>
            )}

            {/* Año */}
            {vehiculo.anio && (
              <div className="flex items-center gap-2">
                <Calendar className="text-lime-300" size={18} />
                <span className="text-white/90">
                  <span className="font-medium">Año:</span> {vehiculo.anio}
                </span>
              </div>
            )}

            {/* Precio */}
            {vehiculo.precioVenta && (
              <div className="flex items-center gap-2">
                <DollarSign className="text-lime-300" size={18} />
                <span className="text-white/90">
                  <span className="font-medium">Precio sugerido:</span>{" "}
                  {vehiculo.precioVenta.toLocaleString("es-AR", {
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
