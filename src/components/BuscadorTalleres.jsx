import { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

export default function BuscadorTalleres({ onSelect }) {
  const [talleres, setTalleres] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    const fetchTalleres = async () => {
      const snapshot = await getDocs(collection(db, "proveedores"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTalleres(data);
    };
    fetchTalleres();
  }, []);

  const talleresFiltrados = talleres.filter((t) =>
    `${t.nombre} ${t.rubro || ""}`.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-3 bg-slate-800 p-4 rounded-xl shadow-lg max-w-md mx-auto">
      <input
        type="text"
        placeholder="🔍 Buscar taller por nombre o rubro..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full p-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
      />

      <div className="max-h-60 overflow-y-auto space-y-2">
        {talleresFiltrados.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="w-full text-left p-3 rounded-lg bg-slate-600 hover:bg-blue-600 transition duration-200 text-white shadow-sm"
          >
            <span className="font-semibold">{t.nombre}</span>
            {t.rubro && <span className="text-sm text-slate-300"> · {t.rubro}</span>}
          </button>
        ))}
        {talleresFiltrados.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-2">
            No se encontraron talleres.
          </p>
        )}
      </div>
    </div>
  );
}