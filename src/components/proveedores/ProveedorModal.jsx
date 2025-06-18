import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

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
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (proveedorActual) {
      reset(proveedorActual);
    } else {
      reset({});
    }
  }, [proveedorActual, reset]);

  const onSubmit = async (data) => {
    try {
      const auth = getAuth();
      const usuario = auth.currentUser;
      const ahora = Timestamp.now(); // <-- Timestamp de Firebase

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

        toast.success("Proveedor actualizado");
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

        toast.success("Proveedor agregado");
      }

      onSave(proveedorGuardado);
      cerrar();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar proveedor");
    }
  };

  return (
    <Transition appear show={abierto} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={cerrar}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/90" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-900 dark:text-white">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 mb-4"
                >
                  {proveedorActual ? "Editar Proveedor" : "Nuevo Proveedor"}
                </Dialog.Title>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Nombre</label>
                    <input
                      type="text"
                      {...register("nombre", { required: true })}
                      className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800"
                    />
                    {errors.nombre && (
                      <p className="text-red-500 text-sm">Campo requerido</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Teléfono
                    </label>
                    <input
                      type="number"
                      {...register("telefono", {
                        required: "El teléfono es obligatorio",
                        pattern: {
                          value: /^[0-9+\-\s]*$/, // solo números, +, -, espacios
                          message:
                            "Teléfono inválido, solo números y símbolos + -",
                        },
                        minLength: {
                          value: 7,
                          message: "El teléfono debe tener al menos 7 dígitos",
                        },
                      })}
                      className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800"
                    />
                    {errors.telefono && (
                      <p className="text-red-500 text-sm">
                        {errors.telefono.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                      type="email"
                      {...register("email")}
                      className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Dirección
                    </label>
                    <input
                      type="text"
                      {...register("direccion")}
                      className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Tipo</label>
                    <select
                      {...register("tipo")}
                      className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800"
                    >
                      <option value="General">General</option>
                      <option value="Taller">Taller</option>
                      <option value="Repuestos">Repuestos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Observaciones
                    </label>
                    <textarea
                      {...register("observaciones")}
                      className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={cerrar}
                      className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
