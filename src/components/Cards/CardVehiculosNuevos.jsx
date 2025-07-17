import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import {
  Truck,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Filter,
} from "lucide-react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export default function CardVehiculosNuevos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "precioVenta",
    direction: "desc",
  });

  useEffect(() => {
    const fetchVehiculos = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "vehiculos"),
          where("etiqueta", "==", "Nuevo"),
          orderBy(
            sortConfig.key,
            sortConfig.direction === "asc" ? "asc" : "desc"
          )
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVehiculos(data);
        setTotalItems(data.length);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehiculos();
  }, [sortConfig]);

  // Filtrado y búsqueda
  const filteredVehiculos = vehiculos.filter((vehiculo) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      vehiculo.marca.toLowerCase().includes(searchTermLower) ||
      vehiculo.modelo.toLowerCase().includes(searchTermLower) ||
      vehiculo.patente.toLowerCase().includes(searchTermLower) ||
      vehiculo.año.toString().includes(searchTerm)
    );
  });

  // Paginación
  const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVehiculos.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Ordenamiento
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Vehículos Nuevos/0km", 20, 20);
    doc.setFontSize(10);

    filteredVehiculos.forEach((v, i) => {
      const yPos = 30 + i * 10;
      if (yPos > 280) {
        doc.addPage();
        doc.text("Vehículos Nuevos/0km (cont.)", 20, 20);
        return 30;
      }

      doc.text(
        `${i + 1}. ${v.marca} ${v.modelo} (${v.año}) - ${
          v.patente
        } - ${formatPesosArgentinos(v.precioVenta)}`,
        20,
        yPos
      );
    });

    doc.save("vehiculos_nuevos.pdf");
  };

  // Exportar a XLSX (Excel)
  const exportarExcel = () => {
    const data = filteredVehiculos.map((v) => ({
      Marca: v.marca,
      Modelo: v.modelo,
      Año: v.año,
      Patente: v.patente,
      Precio: v.precioVenta,
      Kilómetros: v.kilometros || 0,
      Estado: "Nuevo",
      Fecha_Ingreso: v.fechaIngreso || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vehículos Nuevos");

    // Ajustar el ancho de las columnas
    worksheet["!cols"] = [
      { width: 15 }, // Marca
      { width: 20 }, // Modelo
      { width: 8 }, // Año
      { width: 12 }, // Patente
      { width: 15 }, // Precio
      { width: 12 }, // Kilómetros
      { width: 10 }, // Estado
      { width: 15 }, // Fecha Ingreso
    ];

    XLSX.writeFile(workbook, "vehiculos_nuevos.xlsx");
  };

  // Formateador de moneda
  const formatPesosArgentinos = (amount) => {
    if (amount === null || amount === undefined) return "$ 0,00";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Truck className="text-blue-400 w-8 h-8" />
          <h3 className="text-xl font-semibold">Vehículos Nuevos/0km</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <span className="text-3xl font-bold text-white bg-blue-500/20 px-3 py-1 rounded-full order-1 sm:order-none">
            {filteredVehiculos.length}
          </span>

          <div className="flex gap-2 order-3 w-full sm:w-auto sm:order-none mt-2 sm:mt-0">
            <button
              onClick={exportarExcel}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center"
              title="Exportar a Excel"
            >
              <Download size={16} />
              Excel
            </button>

            <button
              onClick={exportarPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center"
              title="Exportar a PDF"
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar..."
          className="pl-8 pr-3 py-1 bg-slate-700/50 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Tabla de vehículos */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-gray-400">
                  <th
                    className="pb-2 pl-2 pr-4 cursor-pointer hover:text-white"
                    onClick={() => requestSort("marca")}
                  >
                    <div className="flex items-center gap-1">
                      Marca
                      <Filter
                        size={14}
                        className={
                          sortConfig.key === "marca"
                            ? "text-blue-400"
                            : "opacity-0"
                        }
                      />
                    </div>
                  </th>
                  <th
                    className="pb-2 px-4 cursor-pointer hover:text-white"
                    onClick={() => requestSort("modelo")}
                  >
                    <div className="flex items-center gap-1">
                      Modelo
                      <Filter
                        size={14}
                        className={
                          sortConfig.key === "modelo"
                            ? "text-blue-400"
                            : "opacity-0"
                        }
                      />
                    </div>
                  </th>
                  <th
                    className="pb-2 px-4 cursor-pointer hover:text-white"
                    onClick={() => requestSort("año")}
                  >
                    <div className="flex items-center gap-1">
                      Año
                      <Filter
                        size={14}
                        className={
                          sortConfig.key === "año"
                            ? "text-blue-400"
                            : "opacity-0"
                        }
                      />
                    </div>
                  </th>
                  <th className="pb-2 px-4">Patente</th>
                  <th
                    className="pb-2 px-4 cursor-pointer hover:text-white text-right"
                    onClick={() => requestSort("precioVenta")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Precio
                      <Filter
                        size={14}
                        className={
                          sortConfig.key === "precioVenta"
                            ? "text-blue-400"
                            : "opacity-0"
                        }
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30"
                  >
                    <td className="py-3 pl-2 pr-4 font-medium">{v.marca}</td>
                    <td className="py-3 px-4">{v.modelo}</td>
                    <td className="py-3 px-4">{v.año}</td>
                    <td className="py-3 px-4 font-mono">{v.patente}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-400">
                      {formatPesosArgentinos(v.precioVenta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
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
