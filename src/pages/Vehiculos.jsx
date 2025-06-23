import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import BuscadorCliente from "../components/BuscadorCliente";
import {
  Truck,
  Pencil,
  Trash2,
  PlusCircle,
  XCircle,
  Download,
  Search,
  DollarSign,
  AlertTriangle,
  UserPlus,
  UserCheck,
  Calendar,
  KeyRound,
  IdCard,
  Car,
  User,
  Factory,
} from "lucide-react";
import ModalReparacion from "../components/reparaciones/ModalReparacion";
import TooltipWrapper from "../components/Tooltip/TooltipWrapper";

export default function Vehiculos() {
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [patente, setPatente] = useState("");
  const [año, setAño] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
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
  const [talleres, setTalleres] = useState([]);

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [queryCliente, setQueryCliente] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [vehiculoActual, setVehiculoActual] = useState(null);

  const abrirModalReparacion = (vehiculo) => {
    setVehiculoActual(vehiculo);
    setModalVisible(true);
  };

  const cerrarModalReparacion = () => {
    setVehiculoActual(null);
    setModalVisible(false);
  };

  useEffect(() => {
    const unsubTalleres = onSnapshot(
      collection(db, "proveedores"),
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTalleres(lista);
      }
    );

    const unsubscribe = onSnapshot(collection(db, "vehiculos"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVehiculos(lista);
    });

    const unsubClientes = onSnapshot(collection(db, "clientes"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClientes(lista);
    });

    return () => {
      unsubscribe();
      unsubClientes();
      unsubTalleres();
    };
  }, []);

  const limpiarFormulario = () => {
    setMarca("");
    setModelo("");
    setPatente("");
    setAño("");
    setEstado("");
    setTipo("");
    setPrecioVenta("");
    setClienteId("");
    setEtiqueta("");
    setModoEdicion(false);
    setIdEditar(null);
    setQueryCliente("");
  };

  const mostrarToast = (mensaje, tipo = "ok") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const guardarVehiculo = async () => {
    const user = auth.currentUser;

    if (!marca || !modelo || !patente) {
      mostrarToast("Marca, Modelo y Patente son obligatorios", "error");
      return;
    }

    const patenteExistente = vehiculos.find(
      (v) => v.patente.toLowerCase() === patente.toLowerCase()
    );

    if (!modoEdicion && patenteExistente) {
      mostrarToast("Ya existe un vehículo con esa patente", "error");
      return;
    }

    try {
      if (modoEdicion) {
        await updateDoc(doc(db, "vehiculos", idEditar), {
          marca,
          modelo,
          patente,
          año,
          estado,
          tipo,
          precioVenta: Number(precioVenta) || 0,
          etiqueta,
          clienteId: clienteId || null,
          modificadoPor: user?.email || "Desconocido",
          modificadoEn: new Date(),
        });
        mostrarToast("Vehículo actualizado");
      } else {
        await addDoc(collection(db, "vehiculos"), {
          marca,
          modelo,
          patente,
          año,
          estado,
          tipo,
          precioVenta: Number(precioVenta) || 0,
          etiqueta,
          clienteId: clienteId || null,
          creadoPor: user?.email || "Desconocido",
          creadoEn: new Date(),
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
    setAño(vehiculo.año || "");
    setEstado(vehiculo.estado || "");
    setTipo(vehiculo.tipo || "");
    setPrecioVenta(vehiculo.precioVenta ? vehiculo.precioVenta.toString() : "");
    setClienteId(vehiculo.clienteId || "");
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
      "Precio Venta",
      "Etiqueta",
    ];
    const rows = vehiculosPaginados.map((v) => [
      v.marca,
      v.modelo,
      v.patente,
      v.anio,
      v.estado || "",
      v.tipo || "",
      v.precioVenta || "",
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
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-slate-900/70 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-4xl mx-auto mb-10 border border-slate-700/50"
>
  <div className="flex items-center gap-2 mb-6">
    <PlusCircle className="text-green-400" />
    <h2 className="text-2xl font-bold text-white tracking-wide">
      {modoEdicion ? 'Editar Vehículo' : 'Agregar Vehículo'}
    </h2>
  </div>

  {/* Información básica */}
  <h3 className="text-slate-200 text-sm font-semibold mb-2 mt-6">Información básica</h3>
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[
      { id: 'marca', label: 'Marca', value: marca, setValue: setMarca },
      { id: 'modelo', label: 'Modelo', value: modelo, setValue: setModelo },
      { id: 'patente', label: 'Patente', value: patente, setValue: setPatente },
      { id: 'año', label: 'Año', value: año, setValue: setAño, type: 'number' },
      { id: 'estado', label: 'Estado', value: estado, setValue: setEstado },
      { id: 'tipo', label: 'Tipo', value: tipo, setValue: setTipo },
      { id: 'precioVenta', label: 'Precio de Venta', value: precioVenta, setValue: setPrecioVenta, type: 'number' },
    ].map(({ id, label, value, setValue, type = 'text' }) => (
      <div key={id} className="relative rounded-xl transition-shadow duration-300
          shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
        <input
          id={id}
          type={type}
          placeholder=" "
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="peer p-3 pt-5 w-full rounded-xl bg-slate-800 border border-slate-700 focus:outline-none placeholder-transparent text-white transition duration-300"
          autoComplete="off"
          min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? 'any' : undefined}
          required={['marca', 'modelo', 'patente', 'año'].includes(id)}
        />
        <label
          htmlFor={id}
          className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
        >
          {label}{['marca', 'modelo', 'patente', 'año'].includes(id) ? ' *' : ''}
        </label>
      </div>
    ))}

    {/* Selector etiqueta */}
    <select
      value={etiqueta}
      onChange={(e) => setEtiqueta(e.target.value)}
      className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
    >
      <option value="">Etiqueta</option>
      <option value="Nuevo">Nuevo</option>
      <option value="Usado">Usado</option>
      <option value="Reparación">Reparación</option>
      <option value="Vendido">Vendido</option>
    </select>

    {/* Buscador Cliente */}
    <div className="md:col-span-3">
      <BuscadorCliente value={clienteId} onChange={setClienteId} placeholder="Asignar cliente/Cliente Asignado" />
    </div>
  </div>

  {/* Botones */}
  <div className="flex flex-col md:flex-row gap-4">
    <button
      type="submit"
      className={`flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl transition-all duration-200 shadow-md flex-1
        ${modoEdicion ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}
        hover:scale-[1.02]
      `}
    >
      <PlusCircle size={18} />
      {modoEdicion ? 'Actualizar' : 'Agregar Vehículo'}
    </button>

    {modoEdicion && (
      <button
        type="button"
        onClick={cancelarEdicion}
        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl shadow-md transition-all duration-200 flex-1 hover:scale-[1.02]"
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
          <option value="Nuevo">Nuevo</option>
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
        {vehiculos.length === 0 ? (
          <p className="text-center text-slate-400">
            No hay vehículos que coincidan.
          </p>
        ) : (
          vehiculosPaginados.map((vehiculo) => (
            <motion.div
  key={vehiculo.id}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  className="bg-gradient-to-br from-slate-800 to-slate-700/70 backdrop-blur-sm border border-slate-600 p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
>
  {/* Encabezado */}
  <div className="mb-2 flex justify-between items-center">
    <h3 className="text-lg font-bold text-white">
      {vehiculo.marca} {vehiculo.modelo} * {vehiculo.patente || '-'}
    </h3>
    {vehiculo.etiqueta && (
      <span
        className={`ml-2 px-3 py-0.5 rounded-full text-xs font-semibold ${colorEtiqueta(vehiculo.etiqueta)} text-white`}
      >
        {vehiculo.etiqueta}
      </span>
    )}
  </div>

  {/* Datos principales */}
  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
    <div className="flex items-center gap-2">
      <KeyRound className="w-4 h-4 text-yellow-400" />
      <span>Patente: {vehiculo.patente || '-'}</span>
    </div>
    <div className="flex items-center gap-2">
      <IdCard className="w-4 h-4 text-indigo-400" />
      <span>Estado: {vehiculo.estado || '-'}</span>
    </div>
    <div className="flex items-center gap-2">
      <Car className="w-4 h-4 text-cyan-400" />
      <span>Tipo: {vehiculo.tipo || '-'}</span>
    </div>
    {vehiculo.precioVenta && (
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-400" />
        <span>${vehiculo.precioVenta}</span>
      </div>
    )}
    <div className="col-span-2 flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      <span>Año: {vehiculo.año || '-'}</span>
    </div>
  </div>

  {/* Cliente y Taller */}
  <div className="mt-2 text-sm text-slate-300 space-y-1">
    {vehiculo.clienteId && (
      <div className="flex items-center gap-2 text-indigo-300">
        <User className="w-4 h-4" />
        <span>
        Cliente Dueño: {vehiculo.clienteNombre} {vehiculo.clienteApellido}
        </span>
      </div>
    )}
    {vehiculo.tallerId && (
      <div className="flex items-center gap-2 text-cyan-400">
        <Factory className="w-4 h-4" />
        <span>Taller: {talleres.find((t) => t.id === vehiculo.tallerId)?.nombre || 'Desconocido'}</span>
      </div>
    )}
  </div>

  {/* Metadatos */}
  <div className="mt-3 space-y-1 text-sm">
    <div className="flex items-center gap-2 text-green-400">
      <UserPlus size={14} />
      <span>
       Vendido por: {vehiculo.vendidoPor || ""} ·{" "}
        {vehiculo.vendidoEn
          ? new Date(vehiculo.vendidoEn.seconds * 1000).toLocaleString()
          : "-"}
      </span>
      </div>
      <div className="flex items-center gap-2 text-green-400">
      <UserPlus size={14} />
      <span>
       Creó: {vehiculo.creadoPor || "Desconocido"} ·{" "}
        {vehiculo.creadoEn
          ? new Date(vehiculo.creadoEn.seconds * 1000).toLocaleString()
          : "-"}
      </span>
    </div>
    {vehiculo.modificadoPor && (
      <div className="flex items-center gap-2 text-yellow-300">
        <UserCheck size={14} />
        <span>
          Modifico: {vehiculo.modificadoPor} ·{" "}
          {vehiculo.modificadoEn
            ? new Date(vehiculo.modificadoEn.seconds * 1000).toLocaleString()
            : "-"}
        </span>
      </div>
    )}
  </div>

  {/* Acciones */}
  <div className="flex justify-center gap-4 mt-4 text-lg">
    <TooltipWrapper label="Editar vehículo">
      <button
        onClick={() => editarVehiculo(vehiculo)}
        className="text-indigo-300 hover:text-indigo-500"
      >
        <Pencil />
      </button>
    </TooltipWrapper>

    <TooltipWrapper label="Eliminar vehículo">
      <button
        onClick={() => eliminarVehiculo(vehiculo.id)}
        className="text-red-400 hover:text-red-600"
      >
        <Trash2 />
      </button>
    </TooltipWrapper>

    <TooltipWrapper label="Registrar reparación">
      <button
        onClick={() => abrirModalReparacion(vehiculo)}
        className="text-yellow-400 hover:text-yellow-500"
      >
        <KeyRound />
      </button>
    </TooltipWrapper>
  </div>
</motion.div>

          ))
        )}
      </div>

      <ModalReparacion
        visible={modalVisible}
        vehiculo={vehiculoActual}
        onClose={cerrarModalReparacion}
        onSuccess={() => {
          // refrescar los datos si hiciste cambios
          console.log("Reparación registrada");
        }}
      />

      {/* Paginación */}
      <div className="max-w-3xl mx-auto flex justify-between items-center mt-4 text-white select-none">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pagina === 1}
          className="px-3 py-1 rounded bg-indigo-700 disabled:bg-indigo-900 hover: cursor-pointer"
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
          className="px-3 py-1 rounded bg-indigo-700 disabled:bg-indigo-900 hover: cursor-pointer"
          aria-label="Página siguiente"
        >
          Siguiente &gt;
        </button>
      </div>
    </div>
  );
}
