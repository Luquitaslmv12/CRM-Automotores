// components/proveedores/ProveedorList.jsx
import {
  MessageCircle,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  User,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProveedorList({ proveedores, onEditar, onEliminar, verEstadoCuenta }) {
  return (
  <div className="border border-slate-700 rounded-xl overflow-hidden">
    {/* Encabezado */}
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-slate-800 text-slate-300 text-xs uppercase tracking-wide px-4 py-2 font-semibold border-b border-slate-700">
      <div className="flex items-center gap-2">
        <User size={14} /> Nombre
      </div>
      <div className="flex items-center gap-2">
        <Mail size={14} /> Email / Tel
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={14} /> Dirección
      </div>
      <div className="hidden sm:flex items-center gap-2">Usuario</div>
      <div className="text-right">Acciones</div>
    </div>

    {/* Filas */}
    {proveedores.map((proveedor) => {
      const numeroWhatsApp = proveedor.telefono?.replace(/\D/g, "");
      return (
        <motion.div
          key={proveedor.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center px-4 py-3 border-t border-slate-700 text-sm text-white"
        >
          
          {/* Nombre */}
      <div className="flex items-center gap-2">
  {proveedor.tieneDeuda && (
    <div
      className="p-1 rounded-full bg-transparent animate-pulse"
      title="Este proveedor tiene saldo pendiente"
    >
      <AlertTriangle
        className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.9)]"
      />
    </div>
  )}
  <div className="font-semibold text-blue-400">{proveedor.nombre}</div>
</div>

          {/* Email y Tel */}
          <div className="text-slate-300">
            <div className="flex items-center gap-1">
              <Mail size={14} className="text-slate-500" />
              {proveedor.email || "Sin email"}
            </div>
            <div className="flex items-center gap-1">
              <Phone size={14} className="text-slate-500" />
              <a href={`tel:${proveedor.telefono}`} className="text-blue-400 hover:underline">
                {proveedor.telefono || "-"}
              </a>
            </div>
          </div>

          {/* Dirección */}
          <div className="text-slate-400">{proveedor.direccion || "-"}</div>

          {/* Usuario */}
          <div className="hidden sm:block text-xs text-slate-500">
            <div>
              <span className="text-green-400">Creado:</span> {proveedor.creadoPor || "-"}
            </div>
            <div>
              <span className="text-yellow-400">Mod:</span> {proveedor.modificadoPor || "-"}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 text-sm items-center">
            {numeroWhatsApp && (
              <a
                href={`https://wa.me/${numeroWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-600"
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
            )}
            <button
              onClick={() => onEditar(proveedor)}
              className="text-indigo-400 hover:text-indigo-600"
              aria-label="Editar"
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={() => onEliminar(proveedor)}
              className="text-red-400 hover:text-red-600"
              aria-label="Eliminar"
            >
              <Trash2 size={20} />
            </button>
           <button
         onClick={() => verEstadoCuenta(proveedor.id)}
        className="
       flex items-center gap-1
       text-yellow-500 hover:text-yellow-600 cursor-pointer
       
       "
     aria-label="Ver Estado de Cuenta"
      >
  <Wallet size={18} />
  <span className="hidden sm:inline text-sm font-semibold">Saldo</span>
</button>
          </div>
        </motion.div>
      );
    })}
  </div>
);
}