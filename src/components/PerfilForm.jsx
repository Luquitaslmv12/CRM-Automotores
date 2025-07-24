import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Edit2, Save, X, Loader2, User, Mail, Shield } from 'lucide-react';

export default function PerfilForm({ usuario }) {
  const [nombre, setNombre] = useState(usuario.nombre || '');
  const [telefono, setTelefono] = useState(usuario.telefono || '');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    setGuardando(true);
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid), {
        nombre: nombre.trim(),
        telefono: telefono.trim()
      });
      toast.success('Perfil actualizado correctamente', {
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid #334155'
        }
      });
      setEditando(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar los cambios', {
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid #334155'
        }
      });
    }
    setGuardando(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-6"
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-400" />
          Información Personal
        </h3>
        {!editando ? (
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </button>
        ) : null}
      </div>

      {/* Campos del formulario */}
      <div className="space-y-4">
        {/* Email (solo lectura) */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
            <Mail className="h-4 w-4" /> Correo electrónico
          </label>
          <div className="mt-1 px-3 py-2 bg-slate-800/30 text-slate-300 rounded-lg border border-slate-700">
            {usuario.email}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={!editando}
            className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 ${
              editando
                ? 'bg-slate-800 border-indigo-500/50 text-slate-200 focus:ring-indigo-500/30'
                : 'bg-slate-800/30 text-slate-300 border-slate-700 cursor-not-allowed'
            } border`}
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={!editando}
            placeholder="+54 11 1234-5678"
            className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 ${
              editando
                ? 'bg-slate-800 border-indigo-500/50 text-slate-200 focus:ring-indigo-500/30'
                : 'bg-slate-800/30 text-slate-300 border-slate-700 cursor-not-allowed'
            } border`}
          />
        </div>

        {/* Rol (solo lectura) */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Rol de usuario
          </label>
          <div className="mt-1 px-3 py-2 bg-slate-800/30 text-slate-300 rounded-lg border border-slate-700 capitalize">
            {usuario.rol || 'usuario'}
          </div>
        </div>
      </div>

      {/* Botones de acción (solo en modo edición) */}
      {editando && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-3 pt-2"
        >
          <button
            onClick={() => {
              setEditando(false);
              setNombre(usuario.nombre || '');
              setTelefono(usuario.telefono || '');
            }}
            className="flex items-center gap-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition-colors"
            disabled={guardando}
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={guardando}
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}