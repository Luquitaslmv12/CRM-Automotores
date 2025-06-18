// src/components/ModalReparacion.jsx
import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";

export default function ModalReparacion({
  vehiculo,
  visible,
  onClose,
  onSuccess,
}) {
  const [talleres, setTalleres] = useState([]);
  const [tallerId, setTallerId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    if (visible) {
      const fetchTalleres = async () => {
        const snapshot = await getDocs(collection(db, "proveedores"));
        setTalleres(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      };
      fetchTalleres();
    }
  }, [visible]);

  const guardar = async () => {
    if (!tallerId || !descripcion || !fechaIngreso || !fechaSalida || !precio)
      return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const userName = user?.displayName || user?.email || "Desconocido";

      await addDoc(collection(db, "reparaciones"), {
        vehiculoId: vehiculo.id,
        tallerId,
        descripcionReparacion: descripcion,
        estado: "Reparación",
        fechaIngreso: Timestamp.fromDate(new Date(fechaIngreso)),
        fechaSalida: Timestamp.fromDate(new Date(fechaSalida)),
        precioServicio: Number(precio),

        modificadoPor: userName,
      });

      await updateDoc(doc(db, "vehiculos", vehiculo.id), {
        etiqueta: "Reparación",
        tallerId,
        modificadoPor: userName,
        modificadoEn: Timestamp.now(),
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error al guardar reparación", error);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-center">Registrar Reparación</h2>

        <select
          value={tallerId}
          onChange={(e) => setTallerId(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        >
          <option value="">Seleccionar Taller</option>
          {talleres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        />

        <input
          type="date"
          value={fechaIngreso}
          onChange={(e) => setFechaIngreso(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        />

        <input
          type="date"
          value={fechaSalida}
          onChange={(e) => setFechaSalida(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        />

        <input
          type="number"
          placeholder="Precio del servicio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        />

        <div className="flex justify-between gap-4 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
