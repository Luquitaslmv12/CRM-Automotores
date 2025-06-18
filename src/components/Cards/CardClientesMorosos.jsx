import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Users, Phone, Mail, CheckCircle, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";

export default function CardClientesMorosos() {
  const [morosos, setMorosos] = useState([]);
  const [clienteConfirmar, setClienteConfirmar] = useState(null); // Nuevo estado

  useEffect(() => {
    const fetchMorosos = async () => {
      const q = query(
        collection(db, "clientes"),
        where("etiqueta", "==", "Moroso")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMorosos(data);
    };
    fetchMorosos();
  }, []);

  const marcarPagado = async (id) => {
    try {
      await updateDoc(doc(db, "clientes", id), { etiqueta: "Potencial" });
      setMorosos((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cliente pagó la totalidad de la deuda");
      setClienteConfirmar(null); // Cerrar modal
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar estado");
    }
  };

  const exportarCSV = () => {
    const headers = ["Nombre", "Teléfono", "Email", "Etiqueta"];
    const rows = morosos.map((c) => [
      c.nombre,
      c.telefono,
      c.email || "",
      c.etiqueta,
    ]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    rows.forEach((r) => (csvContent += r.join(",") + "\n"));
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_morosos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Clientes Morosos", 20, 20);
    doc.setFontSize(12);
    morosos.forEach((c, i) => {
      doc.text(
        `${i + 1}. ${c.nombre} - ${c.telefono} - ${c.email || "Sin email"}`,
        20,
        30 + i * 10
      );
    });
    doc.save("clientes_morosos.pdf");
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow border-l-4 border-red-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-2">
        <Users className="text-red-600 w-6 h-6 sm:w-8 sm:h-8" />
        <h3 className="text-lg sm:text-xl font-semibold flex-grow text-center">
          Clientes Morosos
        </h3>

        <button
          onClick={exportarCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          Exportar CSV
        </button>

        <button
          onClick={exportarPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          Exportar PDF
        </button>
      </div>
      <p className="text-2xl font-bold mb-2">{morosos.length}</p>

      <div className="space-y-1 text-sm">
        {morosos.slice(0, 3).map((c) => (
          <div key={c.id} className="flex justify-between items-center">
            <span>
              {c.nombre} {c.apellido}
            </span>
            <div className="flex gap-2">
              <a
                href={`tel:${c.telefono}`}
                className="text-blue-600"
                title="Llamar"
              >
                <Phone size={16} />
              </a>
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="text-green-600"
                  title="Email"
                >
                  <Mail size={16} />
                </a>
              )}
              <button
                onClick={() => setClienteConfirmar(c)}
                className="text-gray-600 hover:text-green-600"
                title="Marcar como pagado"
              >
                <CheckCircle size={16} />
              </button>
              <a
                href={`https://wa.me/${c.telefono}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600"
                title="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {clienteConfirmar && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl max-w-sm w-full shadow-lg">
            <h4 className="text-lg font-semibold mb-2">¿Confirmar pago?</h4>
            <p className="text-sm mb-4">
              Estás por marcar a <strong>{clienteConfirmar.nombre}</strong> como
              cliente sin deuda. Esto significa que abonó la{" "}
              <strong>totalidad</strong> de la deuda y su estado cambiará a{" "}
              <em>Potencial</em>.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setClienteConfirmar(null)}
                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => marcarPagado(clienteConfirmar.id)}
                className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
