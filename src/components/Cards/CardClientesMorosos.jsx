import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Users } from "lucide-react";

export default function CardClientesMorosos() {
  const [morosos, setMorosos] = useState([]);

  useEffect(() => {
    const fetchMorosos = async () => {
      const q = query(collection(db, "clientes"), where("etiqueta", "==", "Moroso"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMorosos(data);
    };
    fetchMorosos();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border-l-4 border-red-500">
      <div className="flex items-center gap-4 mb-2">
        <Users className="text-red-600 w-8 h-8" />
        <h3 className="text-xl font-semibold">Clientes Morosos</h3>
      </div>
      <p className="text-2xl font-bold mb-2">{morosos.length}</p>
      <div className="space-y-1 text-sm">
        {morosos.slice(0, 3).map((c) => (
          <div key={c.id} className="flex justify-between">
            <span>{c.nombre}</span>
            <a
              href={`https://wa.me/${c.telefono}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 underline"
            >
              WhatsApp
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
