import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Truck } from "lucide-react";

export default function CardVehiculosNuevos() {
  const [nuevos, setNuevos] = useState([]);

  useEffect(() => {
    const fetchNuevos = async () => {
      const q = query(collection(db, "vehiculos"), where("etiqueta", "==", "Nuevo"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNuevos(data);
    };
    fetchNuevos();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border-l-4 border-blue-500">
      <div className="flex items-center gap-4 mb-2">
        <Truck className="text-blue-600 w-8 h-8" />
        <h3 className="text-xl font-semibold">Vehículos Nuevos</h3>
      </div>
      <p className="text-2xl font-bold mb-2">{nuevos.length}</p>
      <div className="space-y-1 text-sm">
        {nuevos.slice(0, 3).map((v) => (
          <div key={v.id}>
            Vehiculo: {v.marca} {v.modelo} {v.patente} ({v.año}) ·${v.precioVenta} 
          </div>
        ))}
      </div>
    </div>
  );
}
