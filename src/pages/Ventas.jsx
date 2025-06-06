import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

export default function NuevaVenta() {
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [monto, setMonto] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const clientesSnap = await getDocs(collection(db, "clientes"));
      const vehiculosSnap = await getDocs(
        query(collection(db, "vehiculos"), where("estado", "==", "Disponible"))
      );
      setClientes(clientesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setVehiculos(vehiculosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId || !vehiculoId || !monto) return alert("Completa todos los campos");

    await addDoc(collection(db, "ventas"), {
      clienteId,
      vehiculoId,
      monto: parseFloat(monto),
      fecha: Timestamp.now(),
    });

    // Marcar el vehículo como vendido
    await updateDoc(doc(db, "vehiculos", vehiculoId), {
      disponible: false,
    });

    alert("Venta registrada");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-md mx-auto bg-white rounded-xl shadow space-y-4">
      <h2 className="text-2xl font-bold">Nueva Venta</h2>

      <select
        value={clienteId}
        onChange={(e) => setClienteId(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Seleccionar cliente</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>

      <select
        value={vehiculoId}
        onChange={(e) => setVehiculoId(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Seleccionar vehículo disponible</option>
        {vehiculos.map((v) => (
          <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>
        ))}
      </select>

      <input
        type="number"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Monto"
        className="w-full p-2 border rounded"
      />

      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">
        Registrar venta
      </button>
    </form>
  );
}