import { Dialog } from "@headlessui/react";
import * as XLSX from "xlsx";

export default function ExportarVehiculos({ vehiculos = [], onClose }) {
  const headers = [
    "Marca",
    "Modelo",
    "Patente",
    "Año",
    "Motor",
    "Chasis",
    "Estado",
    "Tipo",
    "Precio Venta",
    "Etiqueta",
  ];

  const exportarExcel = () => {
    const data = vehiculos.map((v) => ({
      Marca: v.marca,
      Modelo: v.modelo,
      Patente: v.patente,
      Año: v.año,
      Motor: v.motor,
      Chasis: v.chasis,
      Estado: v.estado || "",
      Tipo: v.tipo || "",
      "Precio Venta": v.precioVenta || "",
      Etiqueta: v.etiqueta || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

    // Aplicar autofiltro en la tabla
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vehículos");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });

    function s2ab(s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    }

    const blob = new Blob([s2ab(wbout)], {
      type: "application/octet-stream",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vehiculos.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);

    onClose();
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    >
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-5xl shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-white">
          Exportar Vehículos
        </h2>

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-700 rounded-lg">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-indigo-600 text-white sticky top-0 z-10 shadow-sm">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="p-2 text-left text-sm font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v, idx) => (
                <tr key={idx} className="even:bg-gray-600 text-slate-300">
                  <td className="p-2">{v.marca}</td>
                  <td className="p-2">{v.modelo}</td>
                  <td className="p-2">{v.patente}</td>
                  <td className="p-2">{v.año}</td>
                  <td className="p-2">{v.motor}</td>
                  <td className="p-2">{v.chasis}</td>
                  <td className="p-2">{v.estado}</td>
                  <td className="p-2">{v.tipo}</td>
                  <td className="p-2">${v.precioVenta}</td>
                  <td className="p-2">{v.etiqueta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={exportarExcel}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Exportar a Excel
          </button>
        </div>
      </div>
    </Dialog>
  );
}
