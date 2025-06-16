import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";

export default function CardVehiculosUsados() {
  const [usados, setUsados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 3;

  useEffect(() => {
    const fetchUsados = async () => {
      const q = query(
        collection(db, "vehiculos"),
        where("etiqueta", "==", "Usado"),
        where("estado", "==", "Disponible")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsados(data);
    };
    fetchUsados();
  }, []);

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Vehículos Usados Disponibles", 20, 20);
    doc.setFontSize(12);
    usados.forEach((v, i) => {
      doc.text(
        `${i + 1}. ${v.marca} ${v.modelo} - ${v.patente} - ${v.año} - ${v.estado} - $${v.precioVenta}`,
        20,
        30 + i * 10
      );
    });
    doc.save("vehiculos_usados.pdf");
  };

  const totalPaginas = Math.ceil(usados.length / ITEMS_POR_PAGINA);
  const usadosPagina = usados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border-l-4 border-yellow-500">
      <div className="flex items-center gap-4 mb-2">
        <Truck className="text-yellow-600 w-8 h-8" />
        <h3 className="text-xl font-semibold flex-grow">Vehículos Usados Disponibles</h3>
        <button
          onClick={exportarPDF}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
        >
          Exportar PDF
        </button>
      </div>
      <p className="text-2xl font-bold mb-2">{usados.length}</p>
      <div className="space-y-1 text-sm mb-2">
        {usadosPagina.map((v) => (
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

      {/* Controles de paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 mt-2">
          <button
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="p-1 text-gray-600 hover:text-black disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="p-1 text-gray-600 hover:text-black disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
