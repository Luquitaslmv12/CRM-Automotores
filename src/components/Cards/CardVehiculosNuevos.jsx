import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Truck } from "lucide-react";
import { jsPDF } from "jspdf";

export default function CardVehiculosNuevos() {
  const [nuevos, setNuevos] = useState([]);

  useEffect(() => {
    const fetchNuevos = async () => {
      const q = query(
        collection(db, "vehiculos"),
        where("etiqueta", "==", "Nuevo")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNuevos(data);
    };
    fetchNuevos();
  }, []);

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Vehículos Nuevos", 20, 20);
    doc.setFontSize(12);
    nuevos.forEach((v, i) => {
      doc.text(
        `${i + 1}. ${v.marca} ${v.modelo} (${v.año}) - ${v.patente} - $${
          v.precioVenta
        }`,
        20,
        30 + i * 10
      );
    });
    doc.save("vehiculos_nuevos.pdf");
  };

  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow border-l-4 border-blue-500">
      <div className="flex items-center gap-4 mb-2">
        <Truck className="text-blue-600 w-8 h-8" />
        <h3 className="text-xl font-semibold flex-grow">
          Vehículos Nuevos Disponibles
        </h3>
        <button
          onClick={exportarPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          Exportar PDF
        </button>
      </div>
      <p className="text-2xl font-bold mb-2">{nuevos.length}</p>
      <div className="space-y-1 text-sm">
        {nuevos.slice(0, 3).map((v) => (
          <div key={v.id}>
            {v.marca} {v.modelo} ({v.año}) - {v.patente} ·{" "}
            <span className="text-green-600 font-semibold">
              {Number(v.precioVenta).toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
