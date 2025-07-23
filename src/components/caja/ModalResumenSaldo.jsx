import { X, DollarSign, CreditCard, Landmark, HandCoins, Wallet, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function ModalResumenSaldo({ movimientos = [], onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Animación de entrada/salida
  useEffect(() => {
    setIsOpen(true);
    return () => setIsOpen(false);
  }, []);

  const calcularTotales = () => {
    const formasDePago = ["efectivo", "transferencia", "tarjeta", "cheque", "otro"];
    const resumen = {};

    formasDePago.forEach(forma => {
      resumen[forma] = {
        ingresos: 0,
        egresos: 0,
        saldo: 0
      };
    });

    movimientos.forEach(movimiento => {
      const forma = (movimiento.formaDePago && formasDePago.includes(movimiento.formaDePago.toLowerCase())) 
        ? movimiento.formaDePago.toLowerCase() 
        : "efectivo";
      
      const monto = parseFloat(movimiento.monto) || 0;
      
      if (movimiento.tipo === "ingreso") {
        resumen[forma].ingresos += monto;
        resumen[forma].saldo += monto;
      } else {
        resumen[forma].egresos += monto;
        resumen[forma].saldo -= monto;
      }
    });

    return resumen;
  };

  const resumen = calcularTotales();
  
  const formatPesos = (value) => {
    const number = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return number.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getIcon = (forma) => {
    switch(forma) {
      case 'efectivo': return <HandCoins className="w-5 h-5 text-amber-400" />;
      case 'transferencia': return <Landmark className="w-5 h-5 text-blue-400" />;
      case 'tarjeta': return <CreditCard className="w-5 h-5 text-purple-400" />;
      case 'cheque': return <Wallet className="w-5 h-5 text-emerald-400" />;
      default: return <DollarSign className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLabel = (forma) => {
    switch(forma) {
      case 'efectivo': return 'Efectivo';
      case 'transferencia': return 'Transferencia';
      case 'tarjeta': return 'Tarjeta';
      case 'cheque': return 'Cheque';
      default: return 'Otro';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl border border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)"
            }}
          >
            <div className="sticky top-0 bg-slate-800/90 p-5 border-b border-slate-700 flex justify-between items-center backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-500 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  Resumen por Forma de Pago
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <motion.div 
              className="p-5 space-y-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {Object.entries(resumen).map(([forma, datos]) => (
                <motion.div 
                  key={forma} 
                  variants={itemVariants}
                  className="bg-slate-800/50 rounded-xl p-2 border border-slate-700/50 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-700/50 rounded-lg">
                        {getIcon(forma)}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-200">
                        {getLabel(forma)}
                      </h3>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      datos.saldo >= 0 
                        ? "bg-green-900/30 text-green-300" 
                        : "bg-rose-900/30 text-rose-300"
                    }`}>
                      {datos.saldo >= 0 ? (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" /> Positivo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" /> Negativo
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-green-900/20 p-2 rounded-xl border border-green-800/50"
                    >
                      <div className="flex items-center gap-2 text-green-300 mb-1">
                        <ArrowUp className="w-4 h-4" />
                        <p className="text-sm font-medium">Ingresos</p>
                      </div>
                      <p className="text-xl font-bold text-green-100">
                        {formatPesos(datos.ingresos)}
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-rose-900/20 p-2 rounded-xl border border-rose-800/50"
                    >
                      <div className="flex items-center gap-2 text-rose-300 mb-1">
                        <ArrowDown className="w-4 h-4" />
                        <p className="text-sm font-medium">Egresos</p>
                      </div>
                      <p className="text-xl font-bold text-rose-100">
                        {formatPesos(datos.egresos)}
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className={`p-2 rounded-xl border ${
                        datos.saldo >= 0 
                          ? "bg-indigo-900/20 border-indigo-800/50" 
                          : "bg-amber-900/20 border-amber-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-slate-300 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <p className="text-sm font-medium">Saldo Neto</p>
                      </div>
                      <p className={`text-xl font-bold ${
                        datos.saldo >= 0 ? "text-indigo-100" : "text-amber-100"
                      }`}>
                        {formatPesos(datos.saldo)}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            <div className="p-5 border-t border-slate-700/50 flex justify-end">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Cerrar Resumen
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}