import { motion, AnimatePresence } from "framer-motion";
import { 
  Car, KeyRound, Calendar, ScanLine, DollarSign, GaugeCircle, 
  Fuel, Cog, Activity, User, Factory, ShoppingCart, FilePlus, 
  Hammer, AlertCircle, ClipboardList, X 
} from "lucide-react";

const DetailItem = ({ label, value, icon, highlight = false }) => (
  <div className={`flex items-start gap-3 ${highlight ? "bg-slate-700/50 p-3 rounded-lg" : ""}`}>
    <div className="text-blue-400 mt-0.5">{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-base ${value ? "text-white" : "text-slate-500"}`}>
        {value || "No especificado"}
      </p>
    </div>
  </div>
);

export const DetallesVehiculoModal = ({
  vehiculo,
  isOpen,
  onClose,
  talleres = [],
  preciosPorVehiculo = {},
}) => {
  if (!vehiculo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 rounded-xl border border-slate-600 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado */}
            <div className="sticky top-0 z-10 bg-slate-800/90 backdrop-blur-sm p-6 border-b border-slate-600 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Car className="text-blue-400" size={24} />
                <h2 className="text-2xl font-bold text-white">
                  {vehiculo.marca} {vehiculo.modelo} - {vehiculo.patente}
                </h2>
                {vehiculo.etiqueta && (
                  <span
                    className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      vehiculo.etiqueta === "Nuevo"
                        ? "bg-green-600"
                        : vehiculo.etiqueta === "Usado"
                        ? "bg-yellow-500"
                        : vehiculo.etiqueta === "Reparación"
                        ? "bg-red-600"
                        : "bg-indigo-600"
                    } text-white`}
                  >
                    {vehiculo.etiqueta}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sección Datos Básicos */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-400 border-b border-blue-800 pb-2 flex items-center gap-2">
                  <ClipboardList size={18} />
                  Datos Básicos
                </h3>
                <div className="space-y-3">
                  <DetailItem label="Marca" value={vehiculo.marca} icon={<Car size={16} />} />
                  <DetailItem label="Modelo" value={vehiculo.modelo} icon={<Car size={16} />} />
                  <DetailItem label="Tipo" value={vehiculo.tipo} icon={<Car size={16} />} />
                  <DetailItem label="Patente" value={vehiculo.patente} icon={<KeyRound size={16} />} />
                  <DetailItem label="Año" value={vehiculo.año} icon={<Calendar size={16} />} />
                  <DetailItem label="Color" value={vehiculo.color} icon={<ScanLine size={16} />} />
                  <DetailItem 
                    label="Precio Sugerido" 
                    value={vehiculo.precioVenta?.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 0,
                    })} 
                    icon={<DollarSign size={16} />}
                  />
                </div>
              </div>

              {/* Sección Datos Técnicos */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-400 border-b border-green-800 pb-2 flex items-center gap-2">
                  <GaugeCircle size={18} />
                  Datos Técnicos
                </h3>
                <div className="space-y-3">
                  <DetailItem label="N° Motor" value={vehiculo.motor} icon={<GaugeCircle size={16} />} />
                  <DetailItem label="N° Chasis" value={vehiculo.chasis} icon={<ScanLine size={16} />} />
                  <DetailItem label="Kilometraje" value={vehiculo.kilometraje} icon={<GaugeCircle size={16} />} />
                  <DetailItem label="Combustible" value={vehiculo.combustible} icon={<Fuel size={16} />} />
                  <DetailItem label="Transmisión" value={vehiculo.transmision} icon={<Cog size={16} />} />
                  <DetailItem 
                    label="Estado" 
                    value={vehiculo.estado} 
                    icon={<Activity size={16} />}
                    highlight
                  />
                </div>
              </div>

              {/* Sección Adicionales */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xl font-semibold text-yellow-400 border-b border-yellow-800 pb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Información Adicional
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem 
                    label="Fecha de Ingreso" 
                    value={vehiculo.creadoEn?.toDate().toLocaleDateString()} 
                    icon={<Calendar size={16} />} 
                  />
                  <DetailItem 
                    label="Documentación" 
                    value={vehiculo.documentacion} 
                    icon={<FilePlus size={16} />} 
                  />
                  {vehiculo.observaciones && (
                    <div className="md:col-span-2">
                      <DetailItem 
                        label="Observaciones" 
                        value={vehiculo.observaciones} 
                        icon={<ClipboardList size={16} />}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Historial */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xl font-semibold text-purple-400 border-b border-purple-800 pb-2 flex items-center gap-2">
                  <Hammer size={18} />
                  Historial
                </h3>
                <div className="space-y-2 text-sm">
                  <DetailItem 
                    label="Creado por" 
                    value={`${vehiculo.creadoPor} - ${vehiculo.creadoEn?.toDate().toLocaleString()}`} 
                    icon={<User size={16} />} 
                  />
                  {vehiculo.modificadoPor && (
                    <DetailItem 
                      label="Última modificación" 
                      value={`${vehiculo.modificadoPor} - ${vehiculo.modificadoEn?.toDate().toLocaleString()}`} 
                      icon={<Hammer size={16} />} 
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};