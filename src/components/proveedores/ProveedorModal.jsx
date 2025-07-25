import { Dialog, Transition, TransitionChild, DialogPanel } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Phone, Mail, MapPin, ClipboardList, User, ChevronDown } from "lucide-react";

export default function ProveedorModal({
  abierto,
  cerrar,
  proveedorActual,
  onSave,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (proveedorActual) {
      reset(proveedorActual);
    } else {
      reset({});
    }
  }, [proveedorActual, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const usuario = auth.currentUser;
      const ahora = Timestamp.now();

      let proveedorGuardado;

      if (proveedorActual?.id) {
        await updateDoc(doc(db, "proveedores", proveedorActual.id), {
          ...data,
          modificadoPor: usuario.email || usuario.uid,
          modificadoEn: ahora,
        });

        proveedorGuardado = {
          id: proveedorActual.id,
          ...data,
          modificadoPor: usuario.email || usuario.uid,
          modificadoEn: ahora,
        };

        toast.success("Proveedor actualizado correctamente", {
          icon: "✅",
          style: {
            borderRadius: "10px",
            background: "#1f2937",
            color: "#fff",
          },
        });
      } else {
        const docRef = await addDoc(collection(db, "proveedores"), {
          ...data,
          creadoPor: usuario.email || usuario.uid,
          creadoEn: ahora,
          modificadoPor: usuario.email || usuario.uid,
          modificadoEn: ahora,
        });

        proveedorGuardado = {
          id: docRef.id,
          ...data,
          creadoPor: usuario.email || usuario.uid,
          creadoEn: ahora,
          modificadoPor: usuario.email || usuario.uid,
          modificadoEn: ahora,
        };

        toast.success("Proveedor creado exitosamente", {
          icon: "🎉",
          style: {
            borderRadius: "10px",
            background: "#1f2937",
            color: "#fff",
          },
        });
      }

      onSave(proveedorGuardado);
      cerrar();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el proveedor", {
        icon: "❌",
        style: {
          borderRadius: "10px",
          background: "#ef4444",
          color: "#fff",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={abierto} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={cerrar}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-white"
                  >
                    {proveedorActual ? "Editar Proveedor" : "Nuevo Proveedor"}
                  </Dialog.Title>
                  <button
                    onClick={cerrar}
                    className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Nombre del Proveedor
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register("nombre", { required: true })}
                        className="pl-10 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ej: Distribuidora S.A."
                      />
                    </div>
                    <AnimatePresence>
                      {errors.nombre && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-1 text-sm text-red-400"
                        >
                          Este campo es requerido
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Teléfono
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register("telefono", {
                          required: "El teléfono es obligatorio",
                          pattern: {
                            value: /^[0-9+\-\s]*$/,
                            message: "Solo números y símbolos + -",
                          },
                          minLength: {
                            value: 7,
                            message: "Mínimo 7 dígitos",
                          },
                        })}
                        className="pl-10 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ej: +54 11 1234-5678"
                      />
                    </div>
                    <AnimatePresence>
                      {errors.telefono && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-1 text-sm text-red-400"
                        >
                          {errors.telefono.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        {...register("email")}
                        className="pl-10 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ej: contacto@proveedor.com"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Dirección
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register("direccion")}
                        className="pl-10 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ej: Av. Siempreviva 742"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Tipo de Proveedor
                    </label>
                    <div className="relative">
                      <select
                        {...register("tipo")}
                        className="appearance-none w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                      >
                        <option value="General">General</option>
                        <option value="Taller">Taller</option>
                        <option value="Repuestos">Repuestos</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Observaciones
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                        <ClipboardList className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        {...register("observaciones")}
                        rows={3}
                        className="pl-10 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Notas adicionales sobre el proveedor..."
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex justify-end gap-3 pt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <button
                      type="button"
                      onClick={cerrar}
                      disabled={isLoading}
                      className="px-5 py-2.5 rounded-lg border border-gray-700 bg-transparent text-white hover:bg-gray-700/50 transition-colors duration-200 flex items-center justify-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center disabled:opacity-70"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          {proveedorActual ? "Actualizar" : "Guardar"}
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}