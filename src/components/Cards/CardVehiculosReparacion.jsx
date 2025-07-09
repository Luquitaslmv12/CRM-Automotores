import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";
import { Link } from "react-router-dom";

export default function CardVehiculosReparacion() {
  const [reparando, setReparando] = useState([]);
  const [proveedoresMap, setProveedoresMap] = useState({});
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 3;

  useEffect(() => {
    const fetchReparando = async () => {
      const q = query(
        collection(db, "vehiculos"),
        where("etiqueta", "==", "Reparación")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Extraer IDs de talleres únicos
      const tallerIds = [
        ...new Set(data.map((v) => v.tallerId).filter(Boolean)),
      ];

      // Buscar los nombres de los proveedores
      const tallerMap = {};
      await Promise.all(
        tallerIds.map(async (id) => {
          const ref = doc(db, "proveedores", id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            tallerMap[id] = snap.data().nombre || "Taller sin nombre";
          } else {
            tallerMap[id] = "Taller desconocido";
          }
        })
      );

      setReparando(data);
      setProveedoresMap(tallerMap);
    };

    fetchReparando();
  }, []);

  const totalPaginas = Math.ceil(reparando.length / ITEMS_POR_PAGINA);
  const reparandoPagina = reparando.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  const exportarPDF = () => {
    const docPDF = new jsPDF();
    docPDF.setFontSize(16);
    docPDF.text("Vehículos en Reparación", 20, 20);
    docPDF.setFontSize(12);
    reparando.forEach((v, i) => {
      const taller = proveedoresMap[v.tallerId] || "Sin taller";
      docPDF.text(
        `${i + 1}. ${v.marca} ${v.modelo} - ${v.patente} (${taller})`,
        20,
        30 + i * 10
      );
    });
    docPDF.save("vehiculos_en_reparacion.pdf");
  };

  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow border-l-4 border-indigo-500">
      <div className="flex items-center gap-4 mb-2">
        <Wrench className="text-indigo-600 w-8 h-8" />
        <h3 className="text-xl font-semibold flex-grow">En Reparación</h3>
        <button
          onClick={exportarPDF}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
        >
          Exportar PDF
        </button>
      </div>

      <p className="text-2xl font-bold mb-2">
        {reparando.length} vehículo{reparando.length !== 1 ? "s" : ""}
      </p>

      <div className="space-y-3 text-sm mb-2">
        {reparandoPagina.map((v) => (
          <div
            key={v.id}
            className="bg-gray-700 p-2 rounded-md"
          >
            <div className="font-medium text-white">
              {v.marca} {v.modelo} - {v.patente} ({v.año})
            </div>
            {v.tallerId && (
              <div className="text-gray-500 text-xs mt-1">
                🏭 Taller:{" "}
                <Link
                  to={`/proveedores/${v.tallerId}`}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  {proveedoresMap[v.tallerId] || "Ver taller"}
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

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
            onClick={() =>
              setPaginaActual((p) => Math.min(totalPaginas, p + 1))
            }
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
