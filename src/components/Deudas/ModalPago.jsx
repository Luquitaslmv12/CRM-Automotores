import React, { useState, useMemo } from "react";
import { NumericFormat } from "react-number-format";
import { Calendar, Percent, DollarSign, FileText, Check, X, CreditCard, Landmark, Wallet, Banknote } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";

const paymentMethods = [
  { value: "Efectivo", icon: <Banknote size={18} /> },
  { value: "Transferencia", icon: <Landmark size={18} /> },
  { value: "Tarjeta de Crédito", icon: <CreditCard size={18} /> },
  { value: "Tarjeta de Débito", icon: <CreditCard size={18} /> },
  { value: "Cheque", icon: <FileText size={18} /> },
  { value: "Otro", icon: <Wallet size={18} /> }
];

const ModalPago = ({ deuda, onClose, onConfirm }) => {
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [montoPagado, setMontoPagado] = useState("");
  const [esPagoParcial, setEsPagoParcial] = useState(false);
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState("");
  const [interes, setInteres] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [activeTab, setActiveTab] = useState("pago");

  const calcularSaldoPendiente = (deuda) => {
  if (!deuda.deudas || deuda.deudas.length === 0) return 0;
  
  // Suma todos los montos pendientes de todas las cuotas
  return deuda.deudas.reduce((total, cuota) => {
    const pagos = cuota.pagos || [];
    const totalPagado = pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
    const montoCuota = cuota.montoTotal || cuota.monto || 0;
    return total + (montoCuota - totalPagado);
  }, 0);
};

  const obtenerResumenCuota = (cuota) => {
  const pagos = cuota.pagos || [];
  const totalPagado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
  const montoOriginal = cuota.montoOriginal || cuota.monto || 0;
  const totalInteresesPagados = pagos.reduce((sum, p) => sum + (p.montoIntereses || 0), 0);
  const totalConInteres = montoOriginal + totalInteresesPagados;
  
  return {
    montoOriginal: Number(montoOriginal),
    totalInteresesPagados: Number(totalInteresesPagados),
    totalPagado: Number(totalPagado),
    totalConInteres: Number(totalConInteres),
    saldoPendiente: Math.max(0, totalConInteres - totalPagado),
    pagos
  };
};


  const saldoPendiente = calcularSaldoPendiente(deuda);
  const montoMaximo = esPagoParcial 
    ? saldoPendiente + (saldoPendiente * (interes / 100)) 
    : saldoPendiente;

  const montoNumerico = parseFloat(montoPagado.replace(/\./g, '').replace(',', '.')) || 0;
  const interesNumerico = parseFloat(String(interes).replace(/\./g, '').replace(',', '.'));
const interesCalculado = montoNumerico * (interesNumerico / 100);

  const nuevoSaldo = React.useMemo(() => {
  const montoNum = parseFloat(montoPagado.replace(/\./g, '').replace(',', '.')) || 0;
  const interesCalc = esPagoParcial ? montoNum * (interes / 100) : 0;
  return Math.max(0, saldoPendiente - montoNum + interesCalc);
}, [montoPagado, saldoPendiente, esPagoParcial, interes]);

  const handleSubmit = (e) => {
  e.preventDefault();

  const montoNum = parseFloat(montoPagado.replace(/\./g, '').replace(',', '.')) || 0;
  const interesNum = parseFloat(String(interes).replace(/\./g, '').replace(',', '.')) || 0;
  const interesCalc = esPagoParcial ? montoNum * (interesNum / 100) : 0;

  if (isNaN(montoNum)) {
    toast.error("Ingresa un monto válido");
    return;
  }

  if (montoNum <= 0) {
    toast.error("El monto debe ser mayor a cero");
    return;
  }

  const maxPermitido = esPagoParcial 
    ? saldoPendiente * (1 + (interesNum / 100))
    : saldoPendiente;

  if (montoNum > maxPermitido + 0.01) {
    toast.error(`El monto no puede ser mayor a $${maxPermitido.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`);
    return;
  }

  if (esPagoParcial && !nuevaFechaVencimiento) {
    toast.error("Debes establecer una nueva fecha de vencimiento para pagos parciales");
    return;
  }

  onConfirm({
    metodoPago,
    montoPagado: montoNum,
    interes: interesCalc,
    esPagoParcial,
    nuevaFechaVencimiento: nuevaFechaVencimiento ? new Date(nuevaFechaVencimiento) : null,
    observaciones
  });
};


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <DollarSign className="text-blue-500" size={20} />
              <span>Registrar Pago</span>
            </h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex mt-4 border-b border-slate-200 dark:border-slate-700">
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === "pago" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-slate-600 dark:text-slate-300"}`}
              onClick={() => setActiveTab("pago")}
            >
              <DollarSign size={16} />
              Información de Pago
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === "detalle" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-slate-600 dark:text-slate-300"}`}
              onClick={() => setActiveTab("detalle")}
            >
              <FileText size={16} />
              Detalle de Cuotas
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cliente</p>
                <p className="font-semibold text-slate-800 dark:text-white">{deuda.clienteNombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vehículo</p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {deuda.vehiculoInfo?.marca} {deuda.vehiculoInfo?.modelo} - {deuda.vehiculoInfo?.patente}
                </p>
              </div>
            </div>
          </div>

          {activeTab === "detalle" ? (
            <div className="space-y-4">
              {deuda.deudas.map((cuota, index) => {
                const resumen = obtenerResumenCuota(cuota);
                return (
                  <div key={cuota.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold text-slate-800 dark:text-white">
                        Cuota {index + 1} - Vence: {new Date(cuota.fechaVencimiento).toLocaleDateString()}
                      </h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Monto original:</span>
                          <span className="font-medium">${resumen.montoOriginal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Intereses:</span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            +${resumen.totalInteresesPagados.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Total con interés:</span>
                          <span className="font-medium">${resumen.totalConInteres.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Pagado:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            ${resumen.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Saldo pendiente:</span>
                          <span className={`font-medium ${resumen.saldoPendiente > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                            ${resumen.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Método de pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setMetodoPago(method.value)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${metodoPago === method.value 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                          : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                      >
                        {method.icon}
                        <span className="text-sm">{method.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Monto a pagar *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                    <NumericFormat
  value={montoPagado}
  onValueChange={(values) => {
    setMontoPagado(values.formattedValue);
  }}
  thousandSeparator="."
  decimalSeparator=","
  decimalScale={2}
  fixedDecimalScale
  placeholder="0,00"
  className="w-full pl-8 pr-4 py-3 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  required
/>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
  Máximo: ${saldoPendiente.toLocaleString('es-AR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}
</div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pago-parcial"
                  checked={esPagoParcial}
                  onChange={(e) => setEsPagoParcial(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                />
                <label htmlFor="pago-parcial" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                  Es un pago parcial
                </label>
              </div>

              {esPagoParcial && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nueva fecha de vencimiento
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                          <Calendar size={18} />
                        </div>
                        <input
                          type="date"
                          value={nuevaFechaVencimiento}
                          onChange={(e) => setNuevaFechaVencimiento(e.target.value)}
                          className="pl-10 w-full py-3 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Interés aplicado (%)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                          <Percent size={18} />
                        </div>
                        <NumericFormat
                          value={interes}
                           onValueChange={(values) => {setInteres(values.floatValue || 0);
  }}
                          decimalScale={2}
                          placeholder="0,00"
                          className="pl-10 w-full py-3 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nuevo saldo después del pago:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {interes > 0 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        (Incluye {interes}% de interés: +$
                        {interesCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Detalles del pago, referencia, etc."
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Check size={18} />
                  Confirmar Pago
                </button>
              </div>
            </form>
          )}
        </div>
        <Toaster position="bottom-center" />
      </motion.div>
    </motion.div>
  );
};

export default ModalPago;