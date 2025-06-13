import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Truck } from "lucide-react";

export default function CardVehiculosUsados() {
  const [usados, setUsados] = useState([]);

  useEffect(() => {
    const fetchUsados = async () => {
      const q = query(collection(db, "vehiculos"), where("etiqueta", "==", "Usado"), where("estado", "==", "Disponible"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsados(data);
    };
    fetchUsados();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border-l-4 border-yellow-500">
      <div className="flex items-center gap-4 mb-2">
        <Truck className="text-yellow-600 w-8 h-8" />
        <h3 className="text-xl font-semibold">Vehículos Usados Disponibles</h3>
      </div>
      <p className="text-2xl font-bold mb-2">{usados.length}</p>
      <div className="space-y-1 text-sm">
        {usados.slice(0, 3).map((v) => (
          <div key={v.id}>
            {v.marca} {v.modelo} - {v.estado || "Sin estado"}
          </div>
        ))}
      </div>
    </div>
  );
}
