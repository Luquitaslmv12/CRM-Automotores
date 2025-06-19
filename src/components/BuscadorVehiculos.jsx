// src/components/BuscadorVehiculos.jsx
import { useState, useEffect } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

export default function BuscadorVehiculos({ onSelect }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [resultado, setResultado] = useState([]);

  useEffect(() => {
    const fetchVehiculos = async () => {
      const snapshot = await getDocs(collection(db, "vehiculos"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVehiculos(data);
      setResultado(data);
    };
    fetchVehiculos();
  }, []);

  useEffect(() => {
    if (!filtro.trim()) {
      setResultado(vehiculos);
      return;
    }
    const filtrados = vehiculos.filter((v) =>
      v.patente.toLowerCase().includes(filtro.toLowerCase()) ||
      (v.modelo && v.modelo.toLowerCase().includes(filtro.toLowerCase()))
    );
    setResultado(filtrados);
  }, [filtro, vehiculos]);

  return (
    <div className="space-y-3 bg-slate-800 p-4 rounded-xl shadow-lg max-w-md mx-auto">
      <input
        type="text"
        placeholder="🚗 Buscar por patente o modelo..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full p-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
      />

      <div className="max-h-60 overflow-y-auto rounded-lg">
        {resultado.length > 0 ? (
          <ul className="space-y-2">
            {resultado.map((v) => (
              <li
                key={v.id}
                onClick={() => onSelect(v)}
                className="cursor-pointer p-3 bg-slate-600 rounded-lg hover:bg-blue-600 transition duration-200 text-white"
              >
                <span className="font-semibold">{v.patente}</span>{" "}
                <span className="text-sm text-slate-300">· {v.modelo}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-sm text-slate-400">
            No se encontraron vehículos.
          </div>
        )}
      </div>
    </div>
  );
}
