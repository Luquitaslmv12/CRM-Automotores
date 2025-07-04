import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";

export default function Spinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <LoaderCircle className="w-8 h-8 text-blue-500" />
      </motion.div>
      <span className="mt-3 text-sm">{text}</span>
    </div>
  );
}