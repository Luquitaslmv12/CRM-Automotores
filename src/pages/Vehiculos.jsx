import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Pencil,
  Trash2,
  PlusCircle,
  XCircle,
  Download,
  Search,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function Vehiculos() {
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [patente, setPatente] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEtiqueta, setFiltroEtiqueta] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [toast, setToast] = useState(null);
  const formRef = useRef(null);
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;

  const opcionesVehiculos = {
    Volkswagen: ["Gol", "Voyage", "Amarok", "Saveiro"],
    Toyota: ["Corolla", "Hilux", "Yaris", "Etios"],
    Ford: ["Fiesta", "Focus", "Ranger", "EcoSport"],
    Chevrolet: ["Corsa", "Cruze", "S10", "Tracker"],
    Fiat: ["Uno", "Cronos", "Strada", "Toro"],
  };

  const modelosDisponibles = marca ? opcionesVehiculos[marca] || [] : [];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vehiculos"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVehiculos(lista);
    });
    return () => unsubscribe();
  }, []);

  const limpiarFormulario = () => {
    setMarca("");
    setModelo("");
    setPatente("");
    setEstado("");
    setTipo("");
    setEtiqueta("");
    setModoEdicion(false);
    setIdEditar(null);
  };

  const mostrarToast = (mensaje, tipo = "ok") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const guardarVehiculo = async () => {
    if (!marca || !modelo || !patente) {
      mostrarToast("Marca, Modelo y Patente son obligatorios", "error");
      return;
    }

    try {
      if (modoEdicion) {
        await updateDoc(doc(db, "vehiculos", idEditar), {
          marca,
          modelo,
          patente,
          estado,
          tipo,
          etiqueta,
        });
        mostrarToast("Vehículo actualizado");
      } else {
        await addDoc(collection(db, "vehiculos"), {
          marca,
          modelo,
          patente,
          estado,
          tipo,
          etiqueta,
          fechaRegistro: new Date(),
        });
        mostrarToast("Vehículo agregado");
      }
      limpiarFormulario();
    } catch (err) {
      console.error(err);
      mostrarToast("Error al guardar vehículo", "error");
    }
  };

  const eliminarVehiculo = (id) => {
    setConfirmacion({ tipo: "eliminar", id });
  };

  const confirmarEliminar = async () => {
    try {
      await deleteDoc(doc(db, "vehiculos", confirmacion.id));
      mostrarToast("Vehículo eliminado");
      setConfirmacion(null);
    } catch (err) {
      console.error(err);
      mostrarToast("Error al eliminar vehículo", "error");
    }
  };

  const cancelarEdicion = () => {
    limpiarFormulario();
  };

  const editarVehiculo = (vehiculo) => {
    setMarca(vehiculo.marca || "");
    setModelo(vehiculo.modelo || "");
    setPatente(vehiculo.patente || "");
    setEstado(vehiculo.estado || "");
    setTipo(vehiculo.tipo || "");
    setEtiqueta(vehiculo.etiqueta || "");
    setIdEditar(vehiculo.id);
    setModoEdicion(true);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const exportarCSV = () => {
    setConfirmacion({ tipo: "exportar" });
  };

  const confirmarExportar = () => {
    const headers = [
      "Marca",
      "Modelo",
      "Patente",
      "Estado",
      "Tipo",
      "Etiqueta",
    ];
    const rows = vehiculos.map((v) => [
      v.marca,
      v.modelo,
      v.patente,
      v.estado || "",
      v.tipo || "",
      v.etiqueta || "",
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehiculos.csv";
    a.click();
    URL.revokeObjectURL(url);

    mostrarToast("Exportación realizada");
    setConfirmacion(null);
  };

  const resultados = vehiculos.filter((v) => {
    const matchBusqueda =
      v.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.patente.toLowerCase().includes(busqueda.toLowerCase());
    const matchEtiqueta = !filtroEtiqueta || v.etiqueta === filtroEtiqueta;
    return matchBusqueda && matchEtiqueta;
  });

  const totalPaginas = Math.ceil(resultados.length / itemsPorPagina);
  const vehiculosPaginados = resultados.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  );

  const colorEtiqueta = (etiqueta) => {
    switch (etiqueta) {
      case "Nuevo":
        return "bg-green-600";
      case "Usado":
        return "bg-yellow-500";
      case "Reparación":
        return "bg-red-600";
      case "Vendido":
        return "bg-gray-500";
      default:
        return "bg-indigo-600";
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Gestión de Vehículos
      </h1>

      {/* Toast notificación */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
              toast.tipo === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.mensaje}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación */}
      <AnimatePresence>
        {confirmacion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-sm w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-400" />
                <h2 className="text-xl font-semibold">
                  {confirmacion.tipo === "eliminar"
                    ? "¿Eliminar vehículo?"
                    : "¿Exportar vehículos?"}
                </h2>
              </div>
              <p>
                {confirmacion.tipo === "eliminar"
                  ? "Esta acción no se puede deshacer."
                  : "Se descargará un archivo CSV."}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmacion(null)}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={
                    confirmacion.tipo === "eliminar"
                      ? confirmarEliminar
                      : confirmarExportar
                  }
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario */}
      <motion.form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          guardarVehiculo();
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-3xl mx-auto mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle className="text-green-400" />
          <h2 className="text-xl font-semibold">
            {modoEdicion ? "Editar Vehiculo" : "Agregar Vehiculo"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={marca}
            onChange={(e) => {
              setMarca(e.target.value);
              setModelo(""); // Reiniciamos el modelo al cambiar la marca
            }}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
          >
            <option value="">Seleccionar marca</option>
            {Object.keys(opcionesVehiculos).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
            disabled={!marca}
          >
            <option value="">Seleccionar modelo</option>
            {modelosDisponibles.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Patente *"
            value={patente}
            onChange={(e) => setPatente(e.target.value)}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
            required
          />
          <input
            type="text"
            placeholder="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
          />
          <input
            type="text"
            placeholder="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
          />
          {/* <input
            type="number"
            placeholder="Precio de Venta"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
            min="0"
            step="any"
          /> */}
        </div>
        <select
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
          className="w-full p-3 rounded bg-slate-700 border border-slate-600 text-white mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
        >
          <option value="">Seleccionar Etiqueta</option>
          <option value="Nuevo">0KM</option>
          <option value="Usado">Usado</option>
          <option value="Reparación">Reparación</option>
          <option value="Vendido">Vendido</option>
        </select>

        <div className="flex gap-4">
          <button
            onClick={guardarVehiculo}
            className={`flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg transition flex-1
        ${
          modoEdicion
            ? "bg-green-600 hover:bg-green-700"
            : "bg-indigo-700 hover:bg-indigo-800"
        }`}
          >
            <PlusCircle size={18} />{" "}
            {modoEdicion ? "Actualizar" : "Agregar Cliente"}
          </button>

          {modoEdicion && (
            <button
              onClick={cancelarEdicion}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition flex-1"
            >
              Cancelar
            </button>
          )}
        </div>
      </motion.form>

      {/* Filtros y exportar */}
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo o patente..."
            className="w-full pl-10 pr-10 py-3 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600 transition"
              aria-label="Limpiar búsqueda"
            >
              <XCircle size={20} />
            </button>
          )}
        </div>

        <select
          className="w-full md:w-48 p-3 rounded bg-slate-700 border border-slate-600 text-white"
          value={filtroEtiqueta}
          onChange={(e) => setFiltroEtiqueta(e.target.value)}
        >
          <option value="">Todas las etiquetas</option>
          <option value="Nuevo">0KM</option>
          <option value="Usado">Usado</option>
          <option value="Reparación">Reparación</option>
          <option value="Vendido">Vendido</option>
        </select>

        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-3 rounded bg-indigo-700 hover:bg-indigo-800 text-white transition"
          aria-label="Exportar vehículos CSV"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      {/* Listado paginado */}

      <div className="space-y-3 max-w-3xl mx-auto">
        {vehiculosPaginados.length === 0 ? (
          <p className="text-center text-slate-400">
            No hay vehículos para mostrar.
          </p>
        ) : (
          vehiculosPaginados.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-700 p-4 rounded-xl shadow-md flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-semibold">
                  {v.marca} {v.modelo}
                </p>
                <p className="text-sm text-slate-300">
                  Patente: <span className="uppercase">{v.patente}</span> ·
                  Estado: {v.estado || "-"} · Tipo: {v.tipo || "-"} · Precio: $
                  {v.precioVenta?.toLocaleString() || "-"}
                </p>
                {v.etiqueta && (
                  <p
                    className={`text-xs inline-block mt-1 px-2 py-1 rounded-full text-white ${colorEtiqueta(
                      v.etiqueta
                    )}`}
                  >
                    {v.etiqueta}
                  </p>
                )}
              </div>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => editarVehiculo(v)}
                  className="text-indigo-300 hover:text-indigo-500"
                  aria-label="Editar vehículo"
                >
                  <Pencil />
                </button>
                <button
                  onClick={() => eliminarVehiculo(v.id)}
                  className="text-red-400 hover:text-red-600"
                  aria-label="Eliminar vehículo"
                >
                  <Trash2 />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Paginación */}
      <div className="max-w-3xl mx-auto flex justify-between items-center mt-4 text-indigo-300 select-none">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pagina === 1}
          className="px-3 py-1 rounded bg-indigo-700 disabled:bg-indigo-900"
          aria-label="Página anterior"
        >
          &lt; Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas || 1}
        </span>
        <button
          onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          disabled={pagina === totalPaginas || totalPaginas === 0}
          className="px-3 py-1 rounded bg-indigo-700 disabled:bg-indigo-900"
          aria-label="Página siguiente"
        >
          Siguiente &gt;
        </button>
      </div>
    </div>
  );
}
