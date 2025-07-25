import { useState, useEffect } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  Mail,
  Lock,
  User,
  UserCheck,
  Eye,
  EyeOff,
  Users,
  Edit2,
  Trash2,
  Shield,
  ChevronDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  ShieldHalf,
  UserCog,
  ChevronRight,
  X,
  BadgeCheck,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Admin() {
  const { usuario } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("user");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  // Cargar usuarios solo si es admin
  useEffect(() => {
    if (usuario?.rol === "admin") {
      cargarUsuarios();
    }
  }, [usuario]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setUsuarios(users);
    } catch (error) {
      toast.error("Error al cargar usuarios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: nombre });

      await setDoc(doc(db, "usuarios", user.uid), {
        rol,
        nombre,
        email,
        fechaCreacion: new Date().toISOString(),
      });

      toast.success("Usuario creado correctamente");
      cargarUsuarios();
      resetForm();
    } catch (error) {
      toast.error("Error: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarUsuario = async (userId) => {
    try {
      await updateDoc(doc(db, "usuarios", userId), editData);
      toast.success("Usuario actualizado");
      setIsEditing(null);
      cargarUsuarios();
    } catch (error) {
      toast.error("Error al actualizar usuario");
      console.error(error);
    }
  };

  const confirmarEliminacion = (userId) => {
    setUsuarioAEliminar(userId);
    setShowDeleteModal(true);
  };

  const handleEliminarUsuario = async () => {
    if (!deletePassword) {
      toast.error("Debes ingresar tu contraseña");
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser.uid === usuarioAEliminar) {
        toast.error("No puedes eliminarte a ti mismo");
        return;
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        deletePassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      await deleteDoc(doc(db, "usuarios", usuarioAEliminar));

      toast.success("Usuario eliminado de la base de datos");
      cargarUsuarios();
    } catch (error) {
      toast.error("Error al eliminar: " + error.message);
      console.error(error);
    } finally {
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRol("user");
    setNombre("");
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    idle: { scale: 1 },
    loading: { scale: 0.95, opacity: 0.7 },
    hover: { scale: 1.03 },
    tap: { scale: 0.98 },
  };

  const tabVariants = {
    active: { 
      backgroundColor: "rgba(224, 160, 22, 0.781)",
      borderColor: "rgba(99, 102, 241, 0.5)",
    },
    inactive: { 
      backgroundColor: "rgba(238, 240, 243, 0.473)",
      borderColor: "rgba(54, 45, 58, 0.877)",
    },
    hover: {
      backgroundColor: "rgba(99, 102, 241, 0.1)",
    }
  };

  // Si el usuario no es admin
  if (usuario?.rol !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 p-4 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="max-w-md w-full p-8 bg-slate-800/50 backdrop-blur-lg rounded-xl shadow-2xl border border-indigo-700/30 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Acceso restringido
          </h2>
          <p className="text-slate-400 mb-6">
            Solo los administradores pueden acceder a esta sección
          </p>
          <motion.button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Volver atrás
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-4 md:p-8">
      {/* Modal de confirmación para eliminar */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-rose-700/30 shadow-xl shadow-rose-950/30"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-rose-500/20 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Confirmar eliminación
                  </h3>
                  <p className="text-slate-400 mt-1">
                    Esta acción no se puede deshacer. Ingresa tu contraseña para
                    confirmar.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="Tu contraseña"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-transparent transition"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <motion.button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 flex items-center gap-2"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </motion.button>
                  <motion.button
                    onClick={handleEliminarUsuario}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 rounded-lg text-white flex items-center gap-2 shadow-lg shadow-rose-500/20"
                    disabled={!deletePassword}
                    whileHover={!loading ? { scale: 1.03 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Eliminar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 pt-20"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">
                Panel de Administración
              </h1>
              <p className="text-slate-400">
                Gestiona los usuarios y permisos de la plataforma
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <motion.button
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === "users" ? "active" : "inactive"}
              whileHover="hover"
              onClick={() => setActiveTab("users")}
              className="px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-medium"
            >
              <Users className="h-4 w-4" />
              Usuarios
            </motion.button>
            <motion.button
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === "settings" ? "active" : "inactive"}
              whileHover="hover"
              onClick={() => setActiveTab("settings")}
              className="px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-medium"
            >
              <UserCog className="h-4 w-4" />
              Configuración
            </motion.button>
          </div>
        </motion.div>

        {activeTab === "users" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Formulario de creación */}
            <motion.div
              variants={itemVariants}
              className="bg-slate-800/40 backdrop-blur-lg rounded-xl shadow-xl border border-slate-700/30 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg shadow">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Crear Nuevo Usuario
                </h2>
              </div>
              
              <form onSubmit={handleCrearUsuario} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña (mínimo 6 caracteres)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-700/50 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldHalf className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition appearance-none"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    disabled={loading}
                  >
                    <option value="user">Usuario</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 h-4 w-4 pointer-events-none" />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  variants={buttonVariants}
                  initial="idle"
                  animate={loading ? "loading" : "idle"}
                  whileHover={!loading ? "hover" : ""}
                  whileTap={!loading ? "tap" : ""}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-lg shadow-lg hover:shadow-pink-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-5 w-5" />
                      Crear Usuario
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Listado de usuarios */}
            <motion.div
              variants={itemVariants}
              className="bg-slate-800/40 backdrop-blur-lg rounded-xl shadow-xl border border-slate-700/30 p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg shadow">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Usuarios Registrados
                    <span className="ml-2 text-sm bg-slate-700/50 text-slate-300 px-2 py-1 rounded-full">
                      {usuarios.length}
                    </span>
                  </h2>
                </div>
                <motion.button
                  onClick={cargarUsuarios}
                  className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.05 } : {}}
                  whileTap={!loading ? { scale: 0.95 } : {}}
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Actualizar
                    </>
                  )}
                </motion.button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {usuarios.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-slate-500"
                  >
                    No hay usuarios registrados
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {usuarios.map((user) => (
                      <motion.div
                        key={user.id}
                        layout
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`bg-slate-700/20 hover:bg-slate-700/30 border rounded-xl p-4 transition-colors ${
                          user.id === usuario.uid
                            ? "border-indigo-500/50"
                            : "border-slate-700/30"
                        }`}
                      >
                        {isEditing === user.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editData.nombre || user.nombre}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  nombre: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              autoFocus
                            />
                            <select
                              value={editData.rol || user.rol}
                              onChange={(e) =>
                                setEditData({ ...editData, rol: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              disabled={user.id === usuario.uid}
                            >
                              <option value="user">Usuario</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Administrador</option>
                            </select>
                            <div className="flex gap-2 justify-end">
                              <motion.button
                                onClick={() => setIsEditing(null)}
                                className="px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg flex items-center gap-1"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <X className="h-4 w-4" />
                                Cancelar
                              </motion.button>
                              <motion.button
                                onClick={() => handleEditarUsuario(user.id)}
                                className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-lg flex items-center gap-1 shadow-lg shadow-indigo-500/20"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Guardar
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white flex items-center gap-2">
                                {user.nombre}
                                {user.id === usuario.uid && (
                                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full flex items-center gap-1">
                                    <BadgeCheck className="h-3 w-3" />
                                    Tú
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-slate-400">{user.email}</p>
                              <div className="flex gap-2 mt-2">
                                <span
                                  className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                                    user.rol === "admin"
                                      ? "bg-violet-500/20 text-violet-400"
                                      : user.rol === "editor"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-slate-600/30 text-slate-300"
                                  }`}
                                >
                                  {user.rol === "admin" && <ShieldCheck className="h-3 w-3 mr-1" />}
                                  {user.rol === "editor" && <Edit2 className="h-3 w-3 mr-1" />}
                                  {user.rol === "user" && <User className="h-3 w-3 mr-1" />}
                                  {user.rol}
                                </span>
                                <span className="inline-flex items-center text-xs text-slate-500 bg-slate-700/30 px-2 py-1 rounded-full">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(user.fechaCreacion).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                onClick={() => {
                                  setIsEditing(user.id);
                                  setEditData({
                                    nombre: user.nombre,
                                    rol: user.rol,
                                  });
                                }}
                                className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-slate-300"
                                title="Editar"
                                disabled={user.id === usuario.uid}
                                whileHover={user.id !== usuario.uid ? { scale: 1.1 } : {}}
                                whileTap={user.id !== usuario.uid ? { scale: 0.9 } : {}}
                              >
                                <Edit2 className="h-4 w-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => confirmarEliminacion(user.id)}
                                className="p-2 bg-rose-600/20 hover:bg-rose-500/30 rounded-lg text-rose-400"
                                title="Eliminar"
                                disabled={user.id === usuario.uid || user.rol === "admin"}
                                whileHover={
                                  !(user.id === usuario.uid || user.rol === "admin")
                                    ? { scale: 1.1 }
                                    : {}
                                }
                                whileTap={
                                  !(user.id === usuario.uid || user.rol === "admin")
                                    ? { scale: 0.9 }
                                    : {}
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/40 backdrop-blur-lg rounded-xl shadow-xl border border-slate-700/30 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow">
                <UserCog className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Configuración del Sistema
              </h2>
            </div>
            <p className="text-slate-400">
              Panel de configuración del sistema (en desarrollo)
            </p>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
}


/* 
import { useState, useEffect } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  Mail,
  Lock,
  User,
  UserCheck,
  Eye,
  EyeOff,
  Users,
  Edit2,
  Trash2,
  Shield,
  ChevronDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  ShieldHalf,
  UserCog,
  ChevronRight,
  X,
  BadgeCheck,
  Calendar,
  Settings,
  Key,
  Database,
  HardDrive,
  Server,
  Menu,
  ChevronLeft,
  LogOut,
  Bell,
  Search,
  Clock,
  Download,
  Upload,
  LockKeyhole,
  Fingerprint,
  Activity,
  FileArchive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Admin() {
  const { usuario, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("user");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar usuarios solo si es admin
  useEffect(() => {
    if (usuario?.rol === "admin") {
      cargarUsuarios();
    }
  }, [usuario]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setUsuarios(users);
    } catch (error) {
      toast.error("Error al cargar usuarios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: nombre });

      await setDoc(doc(db, "usuarios", user.uid), {
        rol,
        nombre,
        email,
        fechaCreacion: new Date().toISOString(),
      });

      toast.success("Usuario creado correctamente");
      cargarUsuarios();
      resetForm();
    } catch (error) {
      toast.error("Error: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarUsuario = async (userId) => {
    try {
      await updateDoc(doc(db, "usuarios", userId), editData);
      toast.success("Usuario actualizado");
      setIsEditing(null);
      cargarUsuarios();
    } catch (error) {
      toast.error("Error al actualizar usuario");
      console.error(error);
    }
  };

  const confirmarEliminacion = (userId) => {
    setUsuarioAEliminar(userId);
    setShowDeleteModal(true);
  };

  const handleEliminarUsuario = async () => {
    if (!deletePassword) {
      toast.error("Debes ingresar tu contraseña");
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser.uid === usuarioAEliminar) {
        toast.error("No puedes eliminarte a ti mismo");
        return;
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        deletePassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      await deleteDoc(doc(db, "usuarios", usuarioAEliminar));

      toast.success("Usuario eliminado de la base de datos");
      cargarUsuarios();
    } catch (error) {
      toast.error("Error al eliminar: " + error.message);
      console.error(error);
    } finally {
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRol("user");
    setNombre("");
  };

  const filteredUsers = usuarios.filter(user => 
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    idle: { scale: 1 },
    loading: { scale: 0.95, opacity: 0.7 },
    hover: { scale: 1.03 },
    tap: { scale: 0.98 },
  };

  const tabVariants = {
    active: { 
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      borderColor: "rgba(99, 102, 241, 0.5)",
    },
    inactive: { 
      backgroundColor: "rgba(30, 41, 59, 0.3)",
      borderColor: "rgba(30, 41, 59, 0.5)",
    },
    hover: {
      backgroundColor: "rgba(99, 102, 241, 0.1)",
    }
  };

  const sidebarVariants = {
    open: { 
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    closed: { 
      x: -280,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  // Si el usuario no es admin
  if (usuario?.rol !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 p-4 bg-gray-50 dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="max-w-md w-full p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Acceso restringido
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            Solo los administradores pueden acceder a esta sección
          </p>
          <motion.button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Volver atrás
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* Sidebar 
      <motion.div 
        initial="open"
        animate={sidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 fixed h-full z-20 shadow-sm"
      >
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "users"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Gestor de Usuarios</span>
          </button>
          
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "settings"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Configuración</span>
          </button>
          
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "security"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <LockKeyhole className="h-5 w-5" />
            <span>Seguridad</span>
          </button>
          
          <button
            onClick={() => setActiveTab("database")}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === "database"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <Database className="h-5 w-5" />
            <span>Base de Datos</span>
          </button>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white">
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{usuario.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Administrador</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content /*
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-72" : "ml-0"}`}>
        {/* Top Navigation /*
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="mr-4 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeTab === "users" && "Gestión de Usuarios"}
              {activeTab === "settings" && "Configuración del Sistema"}
              {activeTab === "security" && "Configuración de Seguridad"}
              {activeTab === "database" && "Gestión de Base de Datos"}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400">
              <Bell className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Modal de confirmación para eliminar /*
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-slate-700 shadow-xl"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      Confirmar eliminación
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">
                      Esta acción no se puede deshacer. Ingresa tu contraseña para
                      confirmar.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="Tu contraseña"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <motion.button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletePassword("");
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-gray-800 dark:text-slate-200 flex items-center gap-2"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </motion.button>
                    <motion.button
                      onClick={handleEliminarUsuario}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-lg text-white flex items-center gap-2 shadow-lg shadow-red-500/10"
                      disabled={!deletePassword}
                      whileHover={!loading ? { scale: 1.03 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Eliminar
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="p-6">
          {activeTab === "users" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Formulario de creación /*
              <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Nuevo Usuario
                  </h2>
                </div>
                
                <form onSubmit={handleCrearUsuario} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña (mínimo 6 caracteres)"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldHalf className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition appearance-none"
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      disabled={loading}
                    >
                      <option value="user">Usuario</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    variants={buttonVariants}
                    initial="idle"
                    animate={loading ? "loading" : "idle"}
                    whileHover={!loading ? "hover" : ""}
                    whileTap={!loading ? "tap" : ""}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-5 w-5" />
                        Crear Usuario
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>

              {/* Listado de usuarios /*
              <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
              >
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg shadow">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Usuarios Registrados
                        <span className="ml-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 px-2 py-1 rounded-full">
                          {usuarios.length}
                        </span>
                      </h2>
                    </div>
                    <motion.button
                      onClick={cargarUsuarios}
                      className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1"
                      disabled={loading}
                      whileHover={!loading ? { scale: 1.05 } : {}}
                      whileTap={!loading ? { scale: 0.95 } : {}}
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3" />
                          Actualizar
                        </>
                      )}
                    </motion.button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredUsers.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchTerm ? "No se encontraron resultados" : "No hay usuarios registrados"}
                    </motion.div>
                  ) : (
                    <AnimatePresence>
                      {filteredUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          layout
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className={`bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 border rounded-xl p-4 transition-colors ${
                            user.id === usuario.uid
                              ? "border-indigo-300 dark:border-indigo-500/50"
                              : "border-gray-200 dark:border-slate-700"
                          }`}
                        >
                          {isEditing === user.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editData.nombre || user.nombre}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    nombre: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                autoFocus
                              />
                              <select
                                value={editData.rol || user.rol}
                                onChange={(e) =>
                                  setEditData({ ...editData, rol: e.target.value })
                                }
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                disabled={user.id === usuario.uid}
                              >
                                <option value="user">Usuario</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Administrador</option>
                              </select>
                              <div className="flex gap-2 justify-end">
                                <motion.button
                                  onClick={() => setIsEditing(null)}
                                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg flex items-center gap-1"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <X className="h-4 w-4" />
                                  Cancelar
                                </motion.button>
                                <motion.button
                                  onClick={() => handleEditarUsuario(user.id)}
                                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-lg flex items-center gap-1 shadow-lg shadow-indigo-500/10"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <BadgeCheck className="h-4 w-4" />
                                  Guardar
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  {user.nombre}
                                  {user.id === usuario.uid && (
                                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full flex items-center gap-1">
                                      <BadgeCheck className="h-3 w-3" />
                                      Tú
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400">{user.email}</p>
                                <div className="flex gap-2 mt-2">
                                  <span
                                    className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                                      user.rol === "admin"
                                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                        : user.rol === "editor"
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                                    }`}
                                  >
                                    {user.rol === "admin" && <ShieldCheck className="h-3 w-3 mr-1" />}
                                    {user.rol === "editor" && <Edit2 className="h-3 w-3 mr-1" />}
                                    {user.rol === "user" && <User className="h-3 w-3 mr-1" />}
                                    {user.rol}
                                  </span>
                                  <span className="inline-flex items-center text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(user.fechaCreacion).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <motion.button
                                  onClick={() => {
                                    setIsEditing(user.id);
                                    setEditData({
                                      nombre: user.nombre,
                                      rol: user.rol,
                                    });
                                  }}
                                  className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-slate-300"
                                  title="Editar"
                                  disabled={user.id === usuario.uid}
                                  whileHover={user.id !== usuario.uid ? { scale: 1.1 } : {}}
                                  whileTap={user.id !== usuario.uid ? { scale: 0.9 } : {}}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  onClick={() => confirmarEliminacion(user.id)}
                                  className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/30 rounded-lg text-red-600 dark:text-red-400"
                                  title="Eliminar"
                                  disabled={user.id === usuario.uid || user.rol === "admin"}
                                  whileHover={
                                    !(user.id === usuario.uid || user.rol === "admin")
                                      ? { scale: 1.1 }
                                      : {}
                                  }
                                  whileTap={
                                    !(user.id === usuario.uid || user.rol === "admin")
                                      ? { scale: 0.9 }
                                      : {}
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configuración del Sistema
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                    Configuración General
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Ajustes básicos del sistema y preferencias
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    Configurar
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Server className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                    Configuración del Servidor
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Ajustes avanzados del servidor y conexiones
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    Configurar
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                    Rendimiento
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Optimización del sistema y monitoreo
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    Configurar
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                    Programación
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Tareas programadas y automatización
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    Configurar
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow">
                  <LockKeyhole className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configuración de Seguridad
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Autenticación de dos factores
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Añade una capa adicional de seguridad a tu cuenta
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Estado: <span className="text-red-500">Inactivo</span>
                    </span>
                    <button className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                      <Fingerprint className="h-4 w-4" />
                      Activar
                    </button>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Registro de actividad
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Revisa los últimos accesos y actividades en el sistema
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-4 py-1.5 rounded-lg flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    Ver registros
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Políticas de contraseñas
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Configura los requisitos para las contraseñas de usuarios
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-4 py-1.5 rounded-lg flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Configurar
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Restricciones de IP
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Limita el acceso desde direcciones IP específicas
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-4 py-1.5 rounded-lg flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Configurar
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "database" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg shadow">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Gestión de Base de Datos
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Respaldo de datos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Crea una copia de seguridad de toda la base de datos
                  </p>
                  <button className="text-sm bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    Generar respaldo
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Restaurar datos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Restaura la base de datos desde un respaldo anterior
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-4 py-1.5 rounded-lg flex items-center gap-1">
                    <Upload className="h-4 w-4" />
                    Seleccionar archivo
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Exportar datos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Exporta datos específicos en diferentes formatos
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-4 py-1.5 rounded-lg flex items-center gap-1">
                    <FileArchive className="h-4 w-4" />
                    Exportar
                  </button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Optimización
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Optimiza y limpia la base de datos para mejorar el rendimiento
                  </p>
                  <button className="text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-300 px-4 py-1.5 rounded-lg flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Optimizar
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div>
  );
} */