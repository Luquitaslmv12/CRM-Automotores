import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";

import ResumenCaja from "../components/caja/ResumenCaja";
import FormularioMovimiento from "../components/caja/FormularioMovimiento";
import ListaMovimientos from "../components/caja/ListaMovimientos";

import BuscadorCliente from "../components/BuscadorCliente";
import BuscadorVehiculo from "../components/BuscadorVehiculo";
import BuscadorTalleres from "../components/BuscadorTalleres";

export default function Caja() {
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "movimientosCaja"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setMovimientos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const agregarMovimiento = async (movimiento) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const userName = user?.displayName || user?.email || "Desconocido";

    await addDoc(collection(db, "movimientosCaja"), {
      ...movimiento,
      fecha: Timestamp.now(),
      creadoPor: userName,
    });
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Caja</h1>
      <ResumenCaja movimientos={movimientos} />
      <FormularioMovimiento
  onAgregar={agregarMovimiento}
  BuscadorCliente={BuscadorCliente}
  BuscadorVehiculo={BuscadorVehiculo}
  BuscadorTalleres={BuscadorTalleres}
/>
      <ListaMovimientos movimientos={movimientos} />
    </div>
  );
}
