import { useState } from 'react';
import Avatar from './Avatar';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

export default function PerfilForm({ usuario }) {
  const [nombre, setNombre] = useState(usuario.nombre || '');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid), {
        nombre: nombre.trim(),
      });
      toast.success('Perfil actualizado');
      setEditando(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar');
    }
    setGuardando(false);
  };

  return (
    <div className="bg-white shadow rounded-md p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Avatar usuario={usuario} size={64} />
        <div>
          <p className="text-gray-700 font-medium">{usuario.email}</p>
          <p className="text-sm text-gray-500 capitalize">Rol: {usuario.rol}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={!editando}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
            editando
              ? 'border-indigo-500 focus:ring focus:ring-indigo-200'
              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
          }`}
        />
      </div>

      <div className="flex justify-end gap-2">
        {editando ? (
          <>
            <button
              onClick={() => setEditando(false)}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}