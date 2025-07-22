import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  abierto,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!abierto) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black"
        style={{ zIndex: 9999 }}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 10000 }}
      >
        <div className="w-full max-w-md rounded-xlp-6 shadow-xl bg-gray-900 text-white">
          <h3 className="text-lg font-medium mb-4">{title}</h3>
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
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}