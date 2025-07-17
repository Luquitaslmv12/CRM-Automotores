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
import {
  Wrench,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function CardVehiculosReparacion() {
  const [reparando, setReparando] = useState([]);
  const [proveedoresMap, setProveedoresMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchReparando = async () => {
      try {
        setIsLoading(true);
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
        setTotalItems(data.length);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReparando();
  }, []);

  // Paginación
  const totalPages = Math.ceil(reparando.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reparando.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const exportarPDF = async () => {
    try {
      setExporting(true);
      const docPDF = new jsPDF();
      docPDF.setFontSize(16);
      docPDF.text("Vehículos en Reparación", 20, 20);
      docPDF.setFontSize(12);

      let yPosition = 30;
      reparando.forEach((v, i) => {
        const taller = proveedoresMap[v.tallerId] || "Sin taller";
        if (yPosition > 280) {
          docPDF.addPage();
          yPosition = 20;
        }
        docPDF.text(`${i + 1}. ${v.marca} ${v.modelo}`, 20, yPosition);
        docPDF.text(`Patente: ${v.patente}`, 20, yPosition + 7);
        docPDF.text(`Año: ${v.año}`, 20, yPosition + 14);
        docPDF.text(`Taller: ${taller}`, 20, yPosition + 21);
        yPosition += 30;
      });

      docPDF.text(
        `Generado el: ${new Date().toLocaleDateString()}`,
        20,
        docPDF.internal.pageSize.height - 10
      );

      docPDF.save("vehiculos_en_reparacion.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border-l-4 border-indigo-500 hover:shadow-indigo-500/20 transition-shadow w-full"
    >
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2  rounded-lg">
              <Wrench className=" w-8 h-8 text-indigo-400 sm:w-10 h-10" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              Vehículos en Reparación
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <span className="text-2xl sm:text-3xl font-bold text-white bg-indigo-500/20 px-2 sm:px-3 py-1 rounded-full">
              {totalItems}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={exportarPDF}
            disabled={exporting || reparando.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 sm:px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center"
            title="Exportar a PDF"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {reparando.length === 0 ? (
            <div className="bg-gray-700/50 p-4 rounded-md text-center text-gray-400">
              No hay vehículos en reparación actualmente
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {currentItems.map((v) => (
                  <motion.div
                    key={v.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gray-700/50 hover:bg-gray-700/70 p-3 rounded-lg border-l-2 border-indigo-400 transition-colors"
                  >
                    <div className="font-medium text-white flex justify-between items-start">
                      <div>
                        {v.marca} {v.modelo}{" "}
                        <span className="text-gray-400">({v.año})</span>
                      </div>
                      <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">
                        {v.patente}
                      </span>
                    </div>
                    {v.tallerId && (
                      <div className="text-gray-400 text-sm mt-2 flex items-center">
                        <span className="mr-1">🏭</span>
                        <Link
                          to={`/proveedores/${v.tallerId}`}
                          className="text-indigo-300 hover:text-indigo-200 hover:underline font-medium transition-colors"
                        >
                          {proveedoresMap[v.tallerId] || "Ver taller"}
                        </Link>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Paginación estilo tabla */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-1 rounded ${
                      currentPage === 1
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-indigo-400 hover:text-indigo-300"
                    }`}
                  >
                    <ChevronLeft size={18} />
                    <span className="hidden sm:inline">Anterior</span>
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
                              ? "bg-indigo-600 text-white"
                              : "text-indigo-400 hover:bg-slate-700"
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
                        : "text-indigo-400 hover:text-indigo-300"
                    }`}
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
