import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { Calendar, Percent, DollarSign, FileText, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";

const ModalPago = ({ deuda, onClose, onConfirm }) => {
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [montoPagado, setMontoPagado] = useState("");
  const [esPagoParcial, setEsPagoParcial] = useState(false);
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState("");
  const [interes, setInteres] = useState(0);
  const [observaciones, setObservaciones] = useState("");

  const calcularSaldoPendiente = (deuda) => {
  if (!deuda.deudas) return 0;
  const totalPagado = deuda.deudas.reduce((sum, cuota) => {
    return sum + (cuota.pagos || []).reduce((s, p) => s + (p.monto || 0), 0);
  }, 0);
  return (deuda.montoTotal || 0) - totalPagado;
};

  const saldoPendiente = calcularSaldoPendiente(deuda);
const montoMaximo = saldoPendiente;


  

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const monto = parseFloat(montoPagado.replace(/\./g, '').replace(',', '.')) || 0;

    if (isNaN(monto) || monto <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (monto > montoMaximo) {
      toast.error(`El monto no puede ser mayor a $${montoMaximo.toFixed(2)}`);
      return;
    }



    onConfirm({
      metodoPago,
      montoPagado: monto,
      esPagoParcial,
      nuevaFechaVencimiento: nuevaFechaVencimiento ? new Date(nuevaFechaVencimiento) : null,
      interes: parseFloat(interes) || 0,
      observaciones
    });
  };

  const montoNumerico = parseFloat(montoPagado.replace(/\./g, '').replace(',', '.')) || 0;
const interesCalculado = montoNumerico * (interes / 100);
const nuevoSaldo = saldoPendiente - montoNumerico + interesCalculado;


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-blue-400" /> Registrar Pago
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-700/50 p-3 rounded-lg">
            <p className="font-medium text-white">Cliente: {deuda.clienteNombre}</p>
            <p className="text-sm text-gray-300">
              Vehículo: {deuda.vehiculoInfo?.marca} {deuda.vehiculoInfo?.modelo} - {deuda.vehiculoInfo?.patente}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Saldo pendiente
              </label>
              <div className="bg-slate-700 p-3 rounded-lg text-red-400 font-semibold">
               <NumericFormat
  value={nuevoSaldo}
  displayType={'text'} 
  thousandSeparator="." 
  decimalSeparator="," 
  prefix="$" 
  decimalScale={2} 
  fixedDecimalScale
  className="text-yellow-400 font-semibold"
/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Método de pago
              </label>
              <select
                className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                required
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                <option value="Cheque">Cheque</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Monto a pagar *
            </label>
            <NumericFormat
              value={montoPagado}
              onValueChange={(values) => setMontoPagado(values.formattedValue)}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              fixedDecimalScale
              placeholder="0,00"
              className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              Máximo: <NumericFormat 
                value={montoMaximo} 
                displayType={'text'} 
                thousandSeparator="." 
                decimalSeparator="," 
                prefix="$" 
                decimalScale={2} 
                fixedDecimalScale
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="pago-parcial"
              checked={esPagoParcial}
              onChange={(e) => setEsPagoParcial(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="pago-parcial" className="text-sm text-gray-300">
              Es un pago parcial
            </label>
          </div>

          {esPagoParcial && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <Calendar size={16} /> Nueva fecha de vencimiento
                </label>
                <div className="flex items-center gap-2 bg-slate-700 p-2 rounded-lg border border-slate-600">
                  <input
                    type="date"
                    value={nuevaFechaVencimiento}
                    onChange={(e) => setNuevaFechaVencimiento(e.target.value)}
                    className="bg-transparent text-white flex-1 focus:outline-none"
                    required={esPagoParcial}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <Percent size={16} /> Interés aplicado (%)
                </label>
                <NumericFormat
                  value={interes}
                  onValueChange={(values) => setInteres(values.floatValue)}
                  decimalScale={2}
                  suffix=" %"
                  className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-slate-700/50 p-3 rounded-lg">
                <p className="text-sm text-white">
                  Nuevo saldo después del pago:{" "}
                  <NumericFormat
                    value={saldoPendiente - parseFloat(montoPagado.replace(/\./g, '').replace(',', '.')) || 0}
                    displayType={'text'} 
                    thousandSeparator="." 
                    decimalSeparator="," 
                    prefix="$" 
                    decimalScale={2} 
                    fixedDecimalScale
                    className="text-yellow-400 font-semibold"
                  />
                </p>
                {interes > 0 && (
  <p className="text-xs text-gray-400 mt-1">
    (Incluye {interes}% de interés: +$
    <NumericFormat
      value={
        (
          parseFloat(montoPagado.replace(/\./g, '').replace(',', '.')) * (interes / 100)
        ) || 0
      }
      displayType={'text'}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
    />)
  </p>
)}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
              <FileText size={16} /> Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Detalles del pago..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white flex items-center gap-1"
            >
              <Check size={16} /> Confirmar Pago
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ModalPago;