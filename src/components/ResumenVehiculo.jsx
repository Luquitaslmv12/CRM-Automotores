import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function ResumenVehiculo({ vehiculo, onRemove }) {
  return (
    <AnimatePresence>
      {vehiculo && (
        <motion.div
          key="vehiculo"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative bg-slate-100 text-slate-800 rounded-2xl shadow-md p-5 w-full"
        >
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition"
            title="Quitar vehículo"
          >
            <X size={20} />
          </button>

          <div className="mb-3">
            <h3 className="text-base font-semibold text-indigo-700 uppercase tracking-wide mb-1">
              Vehículo seleccionado
            </h3>
            <p className="text-xl font-bold">
              {vehiculo.marca} {vehiculo.modelo}
            </p>
          </div>

          {vehiculo.patente && (
            <p className="text-sm text-slate-600">
              🚘 <span className="ml-1 font-medium">Patente:</span> {vehiculo.patente}
            </p>
          )}
          {vehiculo.anio && (
            <p className="text-sm text-slate-600 mt-1">
              📅 <span className="ml-1 font-medium">Año:</span> {vehiculo.anio}
            </p>
          )}
          {vehiculo.color && (
            <p className="text-sm text-slate-600 mt-1">
              🎨 <span className="ml-1 font-medium">Color:</span> {vehiculo.color}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
