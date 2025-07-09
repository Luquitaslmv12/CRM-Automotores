import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";

export default function Spinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-blue-600 select-none">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="drop-shadow-lg"
      >
        <LoaderCircle className="w-10 h-10 stroke-[3]" />
      </motion.div>
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-2 text-sm font-medium"
      >
        {text}
      </motion.span>
    </div>
  );
}
