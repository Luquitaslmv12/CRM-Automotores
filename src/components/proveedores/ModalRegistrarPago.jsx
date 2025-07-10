import React, { useState } from "react";
import { db } from "../../firebase";
import { addDoc, updateDoc, doc, getDoc, Timestamp, collection } from "firebase/firestore";

const ModalRegistrarPago = ({ visible, onClose, reparacionId, onPagoRealizado, tallerId, vehiculoId }) => {
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = Number(monto);

    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      setError("Ingrese un monto válido.");
      return;
    }

    setCargando(true);
    try {
      const reparacionRef = doc(db, "reparaciones", reparacionId);
      const reparacionSnap = await getDoc(reparacionRef);
      if (!reparacionSnap.exists()) throw new Error("Reparación no encontrada.");

      const reparacion = reparacionSnap.data();
      const nuevoSaldo = reparacion.saldo - montoNum;
      const estadoPago = nuevoSaldo <= 0 ? "Saldado" : "Pendiente";
   

      // 1. Guardar el pago en la colección "pagos"
      await addDoc(collection(db, "pagos"), {
        reparacionId,
        monto: montoNum,
        metodo,
        comentario,
        fecha: Timestamp.now(),
        tallerId,
        vehiculoId,
      });

      // 2. Actualizar la reparación
      await updateDoc(reparacionRef, {
        saldo: nuevoSaldo,
        estadoPago,
        modificadoEn: new Date(),
      });

      onPagoRealizado(); // callback para refrescar lista o cerrar modal
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al registrar el pago.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-6 rounded-xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">Registrar Pago</h2>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Monto</label>
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Método de pago</label>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option>Efectivo</option>
            <option>Transferencia</option>
            <option>Débito</option>
            <option>Otro</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Comentario (opcional)</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {cargando ? "Registrando..." : "Registrar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModalRegistrarPago;
