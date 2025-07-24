import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({ mode: "onChange" });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(
        "Si el correo está registrado, recibirás un enlace de recuperación",
        {
          style: {
            borderRadius: "12px",
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #1e293b"
          },
        }
      );
      setEmailSent(true);
    } catch (err) {
      console.error("Reset Password Error:", err.code, err.message);
      if (err.code === "auth/user-not-found") {
        toast.error("No se encontró un usuario con ese correo", {
          style: {
            borderRadius: "12px",
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #1e293b"
          },
        });
      } else {
        toast.error("Error al enviar el correo", {
          style: {
            borderRadius: "12px",
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #1e293b"
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
       <div className="min-h-screen bg-gradient-to-br from-[#0a0e17] via-[#1a1f2e] to-[#2d3748] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl overflow-hidden border border-slate-700/30 shadow-2xl shadow-slate-950/50">
            {/* Decoración superior */}
            <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600"></div>
            
            <div className="p-8">
              {!emailSent ? (
                <>
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                        <LockKeyhole className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <motion.h1 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2"
                    >
                      Recuperar Contraseña <Sparkles className="h-5 w-5 text-amber-400" />
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      transition={{ delay: 0.2 }}
                      className="text-slate-400 text-sm"
                    >
                      Ingresa tu correo para recibir el enlace de recuperación
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
                        <Mail className="h-4 w-4" /> Correo electrónico
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
                          className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200"
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

                    {/* Submit Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <button
                        type="submit"
                        disabled={loading || !isValid}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 hover: cursor-pointer hover:shadow-amber-500/30 transition-all duration-300 ${
                          loading || !isValid ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin h-5 w-5" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar correo</span>
                            <motion.div
                              animate={{
                                x: isHovered ? 5 : 0,
                              }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <ArrowLeft className="h-5 w-5 rotate-180" />
                            </motion.div>
                          </>
                        )}
                      </button>
                    </motion.div>
                  </form>

                  {/* Back to login */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center"
                  >
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 hover: cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver al inicio de sesión
                    </button>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white">Revisa tu correo</h3>
                  <p className="text-slate-400 text-sm">
                    Si el correo está registrado, te enviamos un enlace para
                    restablecer tu contraseña.
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover: cursor-pointer  hover:from-green-400 hover:  to-emerald-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300 "
                  >
                    Volver al inicio de sesión
                    <ArrowLeft className="h-5 w-5 rotate-180 " />
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPassword;