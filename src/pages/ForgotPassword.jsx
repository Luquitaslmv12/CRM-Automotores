import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(
        "Si el correo está registrado, recibirás un enlace de recuperación"
      );
      setEmailSent(true);
    } catch (err) {
      console.error("Reset Password Error:", err.code, err.message);
      if (err.code === "auth/user-not-found") {
        toast.error("No se encontró un usuario con ese correo");
      } else {
        toast.error("Error al enviar el correo");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-center items-center min-h-screen bg-gray-900 px-4"
      >
        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm space-y-6 border border-gray-700">
          {!emailSent ? (
            <>
              <h2 className="text-2xl font-bold text-center text-white">
                Recuperar Contraseña
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <div className="relative">
                  <label htmlFor="email" className="sr-only">
                    Correo electrónico
                  </label>
                  <Mail
                    className="absolute top-3 left-3 text-gray-400"
                    size={20}
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder="Correo electrónico"
                    {...register("email", {
                      required: "El correo es obligatorio",
                      pattern: {
                        value: /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/,
                        message: "Correo no válido",
                      },
                    })}
                    className="pl-10 pr-4 py-2 w-full bg-gray-700 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 ml-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition duration-200 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Enviar correo de recuperación"
                  )}
                </button>
              </form>

              {/* Back to login */}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex items-center justify-center text-sm text-gray-400 hover:text-white transition"
              >
                <ArrowLeft size={16} className="mr-1" />
                Volver al inicio de sesión
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 text-white"
            >
              <CheckCircle className="text-green-400 mx-auto" size={48} />
              <h3 className="text-xl font-semibold">Revisa tu correo</h3>
              <p className="text-gray-300 text-sm">
                Si el correo está registrado, te enviamos un enlace para
                restablecer tu contraseña.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl transition duration-200"
              >
                Volver al inicio de sesión
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default ForgotPassword;
