import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import {
  Users,
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export default function CardClientesMorosos() {
  const [morosos, setMorosos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3); // Puedes ajustar este número
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMorosos = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "clientes"),
          where("etiqueta", "==", "Moroso")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMorosos(data);
        setTotalItems(data.length);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMorosos();
  }, []);

  // Calcular páginas totales
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Obtener items para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = morosos.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const exportarXLSX = () => {
    const data = morosos.map((c) => ({
      Nombre: c.nombre,
      Apellido: c.apellido || "",
      Teléfono: c.telefono,
      Email: c.email || "",
      Etiqueta: c.etiqueta,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes Morosos");

    // Generar archivo XLSX
    XLSX.writeFile(workbook, "clientes_morosos.xlsx", { compression: true });
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Clientes Morosos", 20, 20);
    doc.setFontSize(12);
    morosos.forEach((c, i) => {
      doc.text(
        `${i + 1}. ${c.nombre} ${c.apellido || ""} - ${c.telefono} - ${
          c.email || "Sin email"
        }`,
        20,
        30 + i * 10
      );
    });
    doc.save("clientes_morosos.pdf");
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow-lg border-l-4 border-red-500 min-h-80">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Users className="text-red-400 w-8 h-8" />
          <h3 className="text-xl font-semibold">Clientes Morosos</h3>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-3xl font-bold text-white bg-red-500/20 px-3 py-1 rounded-full">
            {totalItems}
          </span>

          <button
            onClick={exportarXLSX}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Excel
          </button>

          <button
            onClick={exportarPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <>
          <div className="space-y-3 text-sm mb-4">
            {currentItems.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
              >
                <div>
                  <span className="font-medium">
                    {c.nombre} {c.apellido}
                  </span>
                  {c.email && (
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">
                      {c.email}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <a
                    href={`tel:${c.telefono}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Llamar"
                  >
                    <Phone size={18} />
                  </a>

                  {c.email && (
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${c.email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors"
                      title="Enviar email (Gmail)"
                    >
                      <Mail size={18} />
                    </a>
                  )}

                  <a
                    href={`https://wa.me/${c.telefono}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-3 py-1 rounded ${
                  currentPage === 1
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-blue-400 hover:text-blue-300"
                }`}
              >
                <ChevronLeft size={18} />
                Anterior
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentPage === pageNumber
                          ? "bg-blue-600 text-white"
                          : "text-blue-400 hover:bg-slate-700"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-blue-400 hover:text-blue-300"
                }`}
              >
                Siguiente
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
