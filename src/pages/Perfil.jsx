import PerfilForm from "../components/PerfilForm";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { UserCircle, Shield, Mail, Settings, ChevronRight, Bell, Database, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import AvatarEditor from "../Perfil/AvatarEditor";

export default function Perfil() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  if (!usuario) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-900/50 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-indigo-900/50 rounded"></div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
      console.error(error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    toast.success('Preferencias de notificaciones actualizadas');
  };

  const downloadData = () => {
    // Simulación de descarga de datos
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          const blob = new Blob([JSON.stringify(usuario, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `mis-datos-${new Date().toISOString()}.json`;
          a.click();
          resolve();
        }, 1000);
      }),
      {
        loading: 'Preparando tus datos...',
        success: 'Descarga completada',
        error: 'Error al descargar',
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800"
    >
      <div className="max-w-4xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        {/* Header con foto de perfil */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-600 to-violet-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-2 ring-indigo-500/30">
             <AvatarEditor 
  usuario={usuario} 
  onAvatarUpdate={(newUrl) => {
    // Actualizar el estado del usuario en el contexto
    setUser({ ...usuario, photoURL: newUrl });
  }} 
/>
</div>
          </div>
        </div>

        {/* Contenedor principal */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-900/80 to-slate-900 backdrop-blur-lg rounded-xl shadow-2xl shadow-indigo-900/20 border border-slate-800 overflow-hidden">
          {/* Pestañas */}
          <div className="border-b border-slate-800">
            <nav className="flex -mb-px">
              <button 
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${activeTab === 'perfil' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setActiveTab('perfil')}
              >
                <UserCircle className="h-5 w-5" /> Información
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${activeTab === 'seguridad' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setActiveTab('seguridad')}
              >
                <Shield className="h-5 w-5" /> Seguridad
              </button>
            </nav>
          </div>

          {/* Contenido del formulario */}
          <div className="p-6 sm:p-8">
            {activeTab === 'perfil' ? (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-400" />
                  Configuración de perfil
                </h2>
                
                <PerfilForm usuario={usuario} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-400" />
                  Configuración de seguridad
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="font-medium text-slate-300 mb-2">Cambiar contraseña</h3>
                    <p className="text-sm text-slate-400 mb-3">Actualiza tu contraseña regularmente para mantener tu cuenta segura</p>
                    <button 
                      onClick={() => navigate('/reset-password')}
                      className="text-sm bg-slate-700 hover:bg-slate-600 text-indigo-400 px-4 py-2 rounded-lg transition-colors"
                    >
                      Cambiar contraseña
                    </button>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="font-medium text-slate-300 mb-2">Autenticación de dos factores</h3>
                    <p className="text-sm text-slate-400 mb-3">Añade una capa adicional de seguridad a tu cuenta</p>
                    <button 
                      onClick={() => toast('2FA en desarrollo', { icon: '🛠️' })}
                      className="text-sm bg-slate-700 hover:bg-slate-600 text-indigo-400 px-4 py-2 rounded-lg transition-colors"
                    >
                      Activar 2FA
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sección adicional */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-10"
            >
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Preferencias
              </h3>
              
              <div className="space-y-3">
                <button 
                  className="w-full flex justify-between items-center border border-sky-700/80 p-3 hover:bg-slate-800/50 rounded-lg transition-colors group"
                  onClick={toggleNotifications}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-900/30 rounded-lg group-hover:bg-indigo-900/50 transition-colors">
                      <Bell className="h-5 w-5 text-indigo-400" />
                    </div>
                    <span className="text-slate-300 group-hover:text-slate-100">Notificaciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">
                      {showNotifications ? 'Activadas' : 'Desactivadas'}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-slate-200" />
                  </div>
                </button>
                
                <button 
                  className="w-full flex justify-between items-center border border-sky-700/80 p-3 hover:bg-slate-800/50 rounded-lg transition-colors group"
                  onClick={downloadData}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-900/30 rounded-lg group-hover:bg-indigo-900/50 transition-colors">
                      <Database className="h-5 w-5 text-indigo-400" />
                    </div>
                    <span className="text-slate-300 group-hover:text-slate-100">Descargar mis datos</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-slate-200" />
                </button>

                <button 
                  className="w-full flex justify-between items-center border border-red-500/40 p-3 hover:bg-slate-800/50 rounded-lg transition-colors group text-red-400 hover:text-red-300 mt-6"
                  onClick={handleLogout}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-900/20 rounded-lg group-hover:bg-red-900/30 transition-colors">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <span>Cerrar sesión</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-red-500/50 group-hover:text-red-400" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}