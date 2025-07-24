import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Camera, Loader2, CheckCircle, X } from 'lucide-react';

export default function AvatarEditor({ usuario }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleEditClick = () => {
    // Mostrar mensaje de desarrollo
    toast('Función de avatar en desarrollo', { 
      icon: '🛠️',
      style: {
        background: '#c08a3af2',
        color: '#fff',
        border: '1px solid #334155'
      }
    });
    
    // Opcional: Simular que se abre el selector de archivos
    // fileInputRef.current?.click();
  };

  return (
    <div className="relative group">
      {/* Avatar visual */}
      {usuario.photoURL ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-24 w-24 rounded-full bg-cover bg-center shadow-lg ring-2 ring-indigo-500/30"
          style={{ backgroundImage: `url(${usuario.photoURL})` }}
        />
      ) : (
        <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-600 to-violet-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-2 ring-indigo-500/30">
          {usuario.displayName?.charAt(0) || usuario.email?.charAt(0) || 'U'}
        </div>
      )}

      {/* Botón de edición */}
      <button
        className="absolute -bottom-2 -right-2 bg-slate-800 p-2 rounded-full shadow-md hover:bg-slate-700 transition-colors border border-slate-700 z-10"
        onClick={handleEditClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 text-indigo-300 animate-spin" />
        ) : (
          <Camera className="h-4 w-4 text-indigo-300" />
        )}
      </button>

      {/* Input de archivo oculto (opcional) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        disabled
      />
    </div>
  );
}