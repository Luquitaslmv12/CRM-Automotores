import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  collection,
  onSnapshot,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  Calendar,
  DollarSign,
  FilePlus,
  Hammer,
  KeyRound,
  Trash2,
  User,
  UserCircle,
  Download,
  Eye,
  ShoppingCart,
  Search,
  X,
} from "lucide-react";

export default function ListadoCompras() {
  const [compras, setCompras] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [detalleCompra, setDetalleCompra] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "compras"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompras(datos);
    });
    return () => unsubscribe();
  }, []);

  const comprasFiltradas = compras.filter((c) => {
    const q = busqueda.toLowerCase();
    return `${c.marca} ${c.modelo} ${c.patente}`.toLowerCase().includes(q);
  });

  const handleExportarPDF = (compra) => {
    const doc = new jsPDF();

    const logoBase64 = null; // <-- Poner base64 aquí si tenés, sino null

    if (logoBase64) {
      // Poner logo en x=14, y=10, tamaño 30x15 (ajustalo a gusto)
      doc.addImage(logoBase64, "PNG", 14, 10, 30, 15);

      // Texto a la derecha del logo (logo ancho=30, entonces 14+30+10=54)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Detalle de Compra", 54, 20);
    } else {
      // Solo texto centrado en x=14
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Detalle de Compra", 14, 20);
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Campo", "Valor"]],
      body: [
        ["Marca", compra.marca || "-"],
        ["Modelo", compra.modelo || "-"],
        ["Patente", compra.patente || "-"],
        [
          "Precio Compra",
          compra.precioCompra?.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          }) || "-",
        ],
        ["Estado", compra.estado || "-"],
        ["Año", compra.año || "-"],
        ["Tipo", compra.tipo || "-"],
        [
          "Cliente",
          `${compra.cliente?.nombre || ""} ${
            compra.cliente?.apellido || ""
          }`.trim(),
        ],
        ["DNI", compra.cliente?.dni || "-"],
        ["Teléfono", compra.cliente?.telefono || "-"],
        ["Tomado por", compra.recibidoPor || "-"],
        [
          "Tomado en",
          compra.tomadoEn
            ? new Date(compra.tomadoEn.seconds * 1000).toLocaleString()
            : "-",
        ],
        ["Creado por", compra.creadoPor || "-"],
        [
          "Creado en",
          compra.creadoEn
            ? new Date(compra.creadoEn.seconds * 1000).toLocaleString()
            : "-",
        ],
        ["Modificado por", compra.modificadoPor || "-"],
        [
          "Modificado en",
          compra.modificadoEn
            ? new Date(compra.modificadoEn.seconds * 1000).toLocaleString()
            : "-",
        ],
      ],
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [15, 76, 129] },
    });

    doc.save(`compra-${compra.patente || compra.id}.pdf`);
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que querés eliminar esta compra?")) {
      try {
        await deleteDoc(doc(db, "compras", id));
        alert("Compra eliminada correctamente.");
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Ocurrió un error al eliminar.");
      }
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Buscador */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lime-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Buscar por marca, modelo o patente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-slate-800 text-white p-2 pl-10 rounded-md w-1/2"
        />
      </div>

      {/* Lista */}
      {comprasFiltradas.length === 0 ? (
        <p className="text-center text-slate-400">
          No hay compras que coincidan.
        </p>
      ) : (
        comprasFiltradas.map((compra) => (
          <motion.div
            key={compra.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-slate-800 to-slate-700/70 backdrop-blur-sm border border-slate-600 p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">
                {compra.marca} {compra.modelo} · {compra.patente || "-"}
              </h3>
              {compra.etiqueta && (
                <span className="ml-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-600 text-white">
                  {compra.etiqueta}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <strong>Precio Compra:</strong>
                <span className="text-lime-400">
                  {compra.precioCompra?.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    minimumFractionDigits: 0,
                  }) ?? "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-yellow-400" />
                <strong>Estado:</strong>
                <span>{compra.estado || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-400" />
                <strong>Año:</strong>
                <span>{compra.año || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <strong>Tipo:</strong>
                <span>{compra.tipo || "-"}</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-300 space-y-1">
              {compra.cliente && (
                <>
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-indigo-300" />
                    <span>
                      Cliente: {compra.cliente.nombre} {compra.cliente.apellido}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>DNI: {compra.cliente.dni}</span> ·{" "}
                    <span>Teléfono: {compra.cliente.telefono}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-600 text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-lime-500" size={16} />
                <span>
                  <strong className="text-lime-500">Tomado por:</strong>{" "}
                  {compra.tomadoPor || "—"} ·{" "}
                  {compra.tomadoEn
                    ? new Date(compra.tomadoEn.seconds * 1000).toLocaleString()
                    : "—"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FilePlus className="text-indigo-500" size={16} />
                <span>
                  <strong className="text-indigo-500">Creado por:</strong>{" "}
                  {compra.creadoPor || "—"} ·{" "}
                  {compra.creadoEn
                    ? new Date(compra.creadoEn.seconds * 1000).toLocaleString()
                    : "—"}
                </span>
              </div>

              {compra.modificadoPor && (
                <div className="flex items-center gap-2">
                  <Hammer className="text-yellow-500" size={16} />
                  <span>
                    <strong className="text-yellow-500">Modificado por:</strong>{" "}
                    {compra.modificadoPor} ·{" "}
                    {compra.modificadoEn
                      ? new Date(
                          compra.modificadoEn.seconds * 1000
                        ).toLocaleString()
                      : "—"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-4 text-lg">
              <button
                onClick={() => setDetalleCompra(compra)}
                className="text-indigo-300 hover:text-indigo-500"
              >
                <Eye />
              </button>
              <button
                onClick={() => handleExportarPDF(compra)}
                className="text-yellow-400 hover:text-yellow-500"
              >
                <Download />
              </button>
              <button
                onClick={() => handleEliminar(compra.id)}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 />
              </button>
            </div>
          </motion.div>
        ))
      )}

      {/* Modal de Detalle */}
      {detalleCompra && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-lg relative text-white">
            <button
              onClick={() => setDetalleCompra(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">
              {detalleCompra.marca} {detalleCompra.modelo}
            </h2>
            <p className="mb-2">Patente: {detalleCompra.patente}</p>
            <p className="mb-2">
              Precio:{" "}
              {detalleCompra.precioCompra?.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
              })}
            </p>
            <p className="mb-2">Estado: {detalleCompra.estado}</p>
            <p className="mb-2">Año: {detalleCompra.año}</p>
            <p className="mb-2">Tipo: {detalleCompra.tipo}</p>
            {detalleCompra.cliente && (
              <>
                <p className="mb-2">
                  Cliente: {detalleCompra.cliente.nombre}{" "}
                  {detalleCompra.cliente.apellido}
                </p>
                <p className="mb-2">DNI: {detalleCompra.cliente.dni}</p>
                <p className="mb-2">
                  Teléfono: {detalleCompra.cliente.telefono}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
