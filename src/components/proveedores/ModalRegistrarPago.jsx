import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { addDoc, updateDoc, doc, getDoc, Timestamp, collection } from "firebase/firestore";
import { X, DollarSign, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { NumericFormat } from 'react-number-format';

const ModalRegistrarPago = ({ 
  visible, 
  onClose, 
  reparacionId, 
  onPagoRealizado, 
  tallerId, 
  vehiculoId,
  saldoActual 
}) => {
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [infoReparacion, setInfoReparacion] = useState(null);
  const [success, setSuccess] = useState(false);

  // Cargar información de la reparación al abrir el modal
  useEffect(() => {
    if (visible && reparacionId) {
      const cargarInfoReparacion = async () => {
        try {
          const reparacionRef = doc(db, "reparaciones", reparacionId);
          const reparacionSnap = await getDoc(reparacionRef);
          if (reparacionSnap.exists()) {
            setInfoReparacion(reparacionSnap.data());
          }
        } catch (err) {
          console.error("Error cargando información:", err);
          toast.error("Error al cargar información de la reparación");
        }
      };
      cargarInfoReparacion();
    }
  }, [visible, reparacionId]);

  if (!visible) return null;

  const handleSubmit = async (e) => {
  e.preventDefault();

 const montoNum = Number(monto);
  if (!monto || isNaN(montoNum) || montoNum <= 0) {
    setError("Ingrese un monto válido.");
    return;
  }

  if (saldoActual && montoNum > saldoActual) {
    setError(`El monto no puede ser mayor al saldo pendiente (${formatCurrency(saldoActual)})`);
    return;
  }

  setCargando(true);
  setError("");

  try {
    const reparacionRef = doc(db, "reparaciones", reparacionId);
    const reparacionSnap = await getDoc(reparacionRef);
    if (!reparacionSnap.exists()) throw new Error("Reparación no encontrada.");

    const reparacion = reparacionSnap.data();

    // ✅ Obtener nombre del proveedor
    let nombreProveedor = reparacion.proveedorNombre || null;

    if (!nombreProveedor && (reparacion.tallerId || tallerId)) {
      const proveedorRef = doc(db, "proveedores", reparacion.tallerId || tallerId);
      const proveedorSnap = await getDoc(proveedorRef);
      nombreProveedor = proveedorSnap.exists()
        ? proveedorSnap.data().nombre
        : "Proveedor desconocido";
    }

    // ✅ Obtener datos del vehículo
    let vehiculo = reparacion.vehiculoInfo || null;
    if (!vehiculo && vehiculoId) {
      const vehiculoRef = doc(db, "vehiculos", vehiculoId);
      const vehiculoSnap = await getDoc(vehiculoRef);
      vehiculo = vehiculoSnap.exists() ? vehiculoSnap.data() : null;
    }

    const descripcion = `Pago a proveedor ${nombreProveedor} por vehículo ${vehiculo?.marca || ""} ${vehiculo?.modelo || ""}, patente ${vehiculo?.patente || "N/A"}`;

    const nuevoSaldo = reparacion.saldo - montoNum;
    const estadoPago = nuevoSaldo <= 0 ? "Saldado" : "Pendiente";

    // ✅ 1. Guardar el pago
    await addDoc(collection(db, "pagos"), {
      reparacionId,
      monto: montoNum,
      metodo,
      comentario,
      fecha: Timestamp.now(),
      tallerId,
      vehiculoId,
      descripcion,
    });

    // ✅ 2. Registrar en caja_diaria
    await addDoc(collection(db, "caja_diaria"), {
      reparacionId,
      monto: montoNum,
      metodo,
      comentario,
      fecha: Timestamp.now(),
      tallerId,
      vehiculoId,
      descripcion,
      tipo: "egreso",
    });

    // ✅ 3. Actualizar reparación
    await updateDoc(reparacionRef, {
      saldo: nuevoSaldo,
      estadoPago,
      modificadoEn: Timestamp.now(),
    });

    setSuccess(true);
    toast.success(`Pago de ${formatCurrency(montoNum)} registrado correctamente`);
    setTimeout(() => {
      setSuccess(false);
      onPagoRealizado();
      onClose();
    }, 1500);
  } catch (err) {
    console.error("❌ Error registrando pago:", err);
    toast.error("Error al registrar el pago.");
    setError("Ocurrió un error. Intente nuevamente.");
  } finally {
    setCargando(false);
  }
};

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value).replace(/\s/g, '');
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const metodoPagoIconos = {
    Efectivo: <DollarSign className="w-4 h-4" />,
    Transferencia: <CreditCard className="w-4 h-4" />,
    Débito: <CreditCard className="w-4 h-4" />,
    Otro: <DollarSign className="w-4 h-4" />
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg w-full max-w-md relative animate-in fade-in zoom-in-95"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
            <DollarSign className="text-blue-600 dark:text-blue-300 w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Registrar Pago
          </h2>
        </div>

        {infoReparacion && (
  <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-1 text-sm text-gray-600 dark:text-gray-300">
    <p>
      <span className="font-medium">Saldo actual:</span> {formatCurrency(infoReparacion.saldo)}
    </p>
    <p>
      <span className="font-medium">Estado:</span> {infoReparacion.estadoPago}
    </p>
    
    {infoReparacion.vehiculoInfo && (
      <p>
        <span className="font-medium">Vehículo:</span> {infoReparacion.vehiculoInfo.marca} {infoReparacion.vehiculoInfo.modelo} - {infoReparacion.vehiculoInfo.patente}
      </p>
    )}
  </div>
)}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto
            </label>
            <div className="relative">
             <NumericFormat
  value={monto}
  onValueChange={(values) => setMonto(values.value)}
  thousandSeparator="."
  decimalSeparator=","
  allowNegative={false}
  prefix="$ "
  className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
  placeholder="$ 0,00"
  decimalScale={2}
  fixedDecimalScale
  required
/>
             
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Método de pago
            </label>
            <div className="relative">
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 pl-8 appearance-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              >
                {Object.keys(metodoPagoIconos).map((metodo) => (
                  <option key={metodo} value={metodo}>
                    {metodo}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-300">
                {metodoPagoIconos[metodo]}
              </div>
              <div className="absolute right-3 top-2.5 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              rows={3}
              placeholder="Detalles adicionales sobre el pago..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-red-600 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-green-600 dark:text-green-300 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Pago registrado correctamente!</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={cargando}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Registrar Pago
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModalRegistrarPago;