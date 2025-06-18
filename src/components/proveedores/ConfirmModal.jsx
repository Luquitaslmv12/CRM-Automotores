import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function ConfirmModal({
  abierto,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  return (
    <Transition appear show={abierto} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-900 dark:text-white">
                <Dialog.Title as="h3" className="text-lg font-medium mb-4">
                  {title}
                </Dialog.Title>
                <p className="mb-6">{message}</p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onCancel();
                    }}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirmar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
