import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ChevronRight, LogIn, User, KeyRound, Sparkles } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario) {
      navigate("/dashboard");
    }
  }, [usuario, navigate]);

  useEffect(() => {
    // Simulate loading for demonstration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({ mode: "onChange" });

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Bienvenido de vuelta!", {
        icon: "👋",
        style: {
          borderRadius: "12px",
          background: "#1d293a96",
          color: "#fff",
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Credenciales incorrectas", {
        style: {
          borderRadius: "12px",
          background: "#1d293a96",
          color: "#fff",
        },
      });
    } finally {
      setLoading(false);
    }
  };




 return (
  <>
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "12px",
          background: "#0f172a",
          color: "#fff",
          border: "1px solid #1e293b"
        },
      }}
    />
    
    <AnimatePresence>
      {isLoading ? (
        // Modern Loading Screen
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-gradient-to-br from-[#0a0e17] to-[#1a1f2e] flex flex-col items-center justify-center z-50"
        >
          {/* Animated Shapes Background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ x: -100, y: -100, rotate: 0 }}
              animate={{ x: "100vw", y: "100vh", rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-blue-600/10 to-violet-600/10 blur-xl"
            />
            
            <motion.div
              initial={{ x: "100vw", y: 100, rotate: 45 }}
              animate={{ x: -200, y: "100vh", rotate: 405 }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-96 h-96 bg-gradient-to-r from-blue-800/10 to-indigo-800/10 blur-xl rounded-3xl"
            />
            
            <motion.div
              initial={{ x: "50vw", y: "-50vh", rotate: 120 }}
              animate={{ x: "50vw", y: "150vh", rotate: 480 }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-80 h-80 bg-gradient-to-r from-violet-600/10 to-purple-600/10 blur-xl rounded-[40px]"
            />
          </div>
          
          {/* Main Loader Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Animated Logo */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity
              }}
              className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-2xl shadow-blue-500/30"
            >
              <LogIn className="h-12 w-12 text-white" />
            </motion.div>
            
            {/* Loading Text */}
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Cargando Sistema
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.7 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-slate-400 mb-8"
            >
              Preparando tu experiencia...
            </motion.p>
            
            {/* Animated Progress */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full mb-2"
            />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs text-slate-500"
            >
              <span className="font-mono">v2.4.1</span> • Lucas Mariano Viollaz
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e17] via-[#1a1f2e] to-[#2d3748] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="bg-slate-800/70 backdrop-blur-lg rounded-2xl overflow-hidden border border-slate-700/30 shadow-2xl shadow-slate-950/50">
              {/* Decoración superior */}
              <div className="h-2 bg-gradient-to-r from-blue-500 to-violet-600"></div>
              
              <div className="p-8">
                <div className="text-center mb-10">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg">
                      <LogIn className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <motion.h1 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2"
                  >
                    Iniciar Sesión <Sparkles className="h-5 w-5 text-yellow-400" />
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-400"
                  >
                    Accede a tu cuenta para continuar
                  </motion.p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1 flex items-center gap-1">
                      <User className="h-4 w-4" /> Correo electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        {...register("email", {
                          required: "El correo es obligatorio",
                          pattern: {
                            value: /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/,
                            message: "Correo no válido",
                          },
                        })}
                        className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    {errors.email && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-xs mt-1 ml-1"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-slate-300 ml-1 flex items-center gap-1">
                        <KeyRound className="h-4 w-4" /> Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate("/forgotpassword")}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password", {
                          required: "La contraseña es obligatoria",
                          minLength: {
                            value: 6,
                            message: "Mínimo 6 caracteres",
                          },
                        })}
                        className="block w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                        aria-label={
                          showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-xs mt-1 ml-1"
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      type="submit"
                      disabled={loading || !isValid}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 ${
                        loading || !isValid ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <span>Iniciar sesión</span>
                          <motion.div
                            animate={{
                              x: isHovered ? 5 : 0,
                            }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </motion.div>
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
);
}

export default Login;