import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Wrench } from "lucide-react";

export default function CardVehiculosReparacion() {
  const [reparando, setReparando] = useState([]);

  useEffect(() => {
    const fetchReparando = async () => {
      const q = query(collection(db, "vehiculos"), where("etiqueta", "==", "Reparación"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReparando(data);
    };
    fetchReparando();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border-l-4 border-indigo-500">
      <div className="flex items-center gap-4 mb-2">
        <Wrench className="text-indigo-600 w-8 h-8" />
        <h3 className="text-xl font-semibold">En Reparación</h3>
      </div>
      <p className="text-2xl font-bold mb-2">{reparando.length}</p>
      <div className="space-y-1 text-sm">
        {reparando.slice(0, 3).map((v) => (
          <div key={v.id}>
            {v.marca} {v.modelo} {v.patente}
          </div>
        ))}
      </div>
    </div>
  );
}