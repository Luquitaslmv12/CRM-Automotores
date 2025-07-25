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
  UserCircle,
  ShoppingCart,
  FilePlus,
  Hammer,
  ScanLine,
  GaugeCircle,
  Eye,
} from "lucide-react";
import ModalReparacion from "../components/reparaciones/ModalReparacion";
import TooltipWrapper from "../components/Tooltip/TooltipWrapper";
import ExportarVehiculos from "../components/vehiculos/ExportarVehiculos";
import { NumericFormat } from "react-number-format";
import { DetallesVehiculoModal } from "../components/vehiculos/DetallesVehiculoModal";

export default function Vehiculos() {
  const tabs = [
  { id: "basicos", label: "Datos Básicos" },
  { id: "tecnicos", label: "Datos Técnicos" },
  { id: "adicionales", label: "Adicionales" }
];
 const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
 const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
   const [activeTab, setActiveTab] = useState("basicos");
    const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [tipo, setTipo] = useState("");
  const [patente, setPatente] = useState("");
  const [año, setAño] = useState("");
  const [color, setColor] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [motor, setMotor] = useState("");
  const [chasis, setChasis] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [combustible, setCombustible] = useState("Nafta");
  const [transmision, setTransmision] = useState("Manual");
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  const [documentacion, setDocumentacion] = useState("Completos");
  const [observaciones, setObservaciones] = useState("");
  const [usuarioRecibido, setUsuarioRecibido] = useState("");
  const [estado, setEstado] = useState("");
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

    const abrirModalDetalles = (vehiculo) => {
    setVehiculoSeleccionado(vehiculo);
    setModalDetallesAbierto(true);
  };

  const estadoFinal = ["Usado", "Nuevo", ""].includes(etiqueta) ? "Disponible" : "No Disponible";

  const [mostrarExportacion, setMostrarExportacion] = useState(false);

  const exportarCSV = () => {
    setMostrarExportacion(true);
  };

  const [reparaciones, setReparaciones] = useState([]);
  const [preciosPorVehiculo, setPreciosPorVehiculo] = useState({});

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
    const unsubscribe = onSnapshot(
      collection(db, "reparaciones"),
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setReparaciones(lista);

        // Calcular totales por vehiculoId
        const agrupado = lista.reduce((acc, reparacion) => {
          if (
            !reparacion.vehiculoId ||
            typeof reparacion.precioTotal !== "number"
          )
            return acc;

          if (!acc[reparacion.vehiculoId]) {
            acc[reparacion.vehiculoId] = 0;
          }

          acc[reparacion.vehiculoId] += reparacion.precioTotal;
          return acc;
        }, {});

        setPreciosPorVehiculo(agrupado);
      }
    );

    return () => unsubscribe();
  }, []);

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
    setMotor(""),
    setChasis(""),
    setEstado("");
    setTipo("");
    setPrecioVenta("");
    setClienteId("");
    setEtiqueta("");
    setModoEdicion(false);
    setIdEditar(null);
    setQueryCliente("");
    setColor("");
    setKilometraje("");
    setCombustible("");
    setTransmision("");
    setFechaIngreso("");
    setDocumentacion("");
    setObservaciones("");
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
      motor,
      chasis,
       estado: estadoFinal,
      tipo,
      precioVenta: Number(precioVenta) || 0,
      etiqueta,
      clienteId: clienteId || null,
      modificadoPor: user?.email || "Desconocido",
      modificadoEn: new Date(),
      kilometraje,
      combustible,
      transmision,
      fechaIngreso,
      documentacion,
      observaciones,
      color,
    });
        mostrarToast("Vehículo actualizado");
      } else {
        await addDoc(collection(db, "vehiculos"), {
          marca,
          modelo,
          patente,
          año,
          motor,
          chasis,
          estado: estadoFinal,
          tipo,
          precioVenta: Number(precioVenta) || 0,
          etiqueta,
          clienteId: clienteId || null,
          creadoPor: user?.email || "Desconocido",
          creadoEn: new Date(),
          kilometraje,
      combustible,
      transmision,
      fechaIngreso,
      documentacion,
      observaciones,
      color,
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
    setMotor(vehiculo.motor || "");
    setChasis(vehiculo.chasis || "");
    setEstado(vehiculo.estado || "");
    setTipo(vehiculo.tipo || "");
    setPrecioVenta(vehiculo.precioVenta ? vehiculo.precioVenta.toString() : "");
    setClienteId(vehiculo.clienteId || "");
    setEtiqueta(vehiculo.etiqueta || "");
    setIdEditar(vehiculo.id);
    setModoEdicion(true);
    setKilometraje(vehiculo.kilometraje || "")
    setCombustible(vehiculo.combustible || "")
    setTransmision(vehiculo.transmision || "")
    setFechaIngreso(vehiculo.fechaIngreso || "")
    setDocumentacion(vehiculo.documentacion || "")
    setObservaciones(vehiculo.observaciones || "")
    setColor(vehiculo.color || "")

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    <div className="p-6 pt-20 min-h-screen bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-800 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center flex justify-center items-center gap-2">
        <Car className="w-10 h-10 text-yellow-500 animate-bounce" />
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
      onSubmit={(e) => {
        e.preventDefault();
        guardarVehiculo();
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 via-indigo-900/80 to-slate-900 backdrop-blur-lg p-8 rounded-3xl w-full shadow-[0_0_60px_10px_rgba(218,204,8,0.514)] max-w-4xl mx-auto mb-10 border-3 border-yellow-600"
    >
      <div className="flex items-center gap-2 mb-6">
        <PlusCircle className="text-green-400" />
        <h2 className="text-2xl font-bold text-white tracking-wide">
          {modoEdicion ? "Editar Vehículo" : "Agregar Vehículo"}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === tab.id
                ? "text-yellow-400 border-b-2 border-yellow-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de los tabs */}
      <div className="h-full">
        {/* Datos Básicos */}
        {activeTab === "basicos" && (
          <motion.div
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3 }}
  className="grid grid-cols-1 md:grid-cols-2 gap-6"
>
  <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
    <select
      value={etiqueta}
      onChange={(e) => setEtiqueta(e.target.value)}
      className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none text-white transition duration-300"
      required
    >
      <option value="">Seleccionar etiqueta</option>
      <option value="Usado">Usado</option>
      <option value="Nuevo">Nuevo (0KM)</option>
      <option value="Vendido">Vendido</option>
      <option value="Reparación">Reparación</option>
    </select>
  </div>


  {[
    { id: "marca", label: "Marca*", value: marca, setValue: setMarca, placeholder: "Ej: Ford, Toyota" },
    { id: "modelo", label: "Modelo*", value: modelo, setValue: setModelo, placeholder: "Ej: Focus, Corolla" },
    { id: "tipo", label: "Tipo*", value: tipo, setValue: setTipo, placeholder: "Ej: Sedán, SUV, Pickup" },
    { id: "patente", label: "Patente*", value: patente, setValue: setPatente, placeholder: "Ej: AB123CD" },
    { id: "año", label: "Año*", value: año, setValue: setAño, type: "number" },
    { id: "color", label: "Color", value: color, setValue: setColor, placeholder: "Color principal" },
  ].map(({ id, label, value, setValue, type = "text", placeholder = "" }) => (
    <div
      key={id}
      className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70"
    >
      <input
        id={id}
        type={type}
        placeholder={placeholder || " "}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none placeholder-transparent text-white transition duration-300"
        autoComplete="off"
        min={type === "number" ? 0 : undefined}
        required={label.includes("*")}
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
      >
        {label}
      </label>
    </div>
  ))}

  {/* Campo de precio con NumericFormat */}
  <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
    <NumericFormat
      id="precioVenta"
      value={precioVenta}
      onValueChange={(values) => {
        setPrecioVenta(values.floatValue || 0);
      }}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      prefix="$ "
      placeholder="$ "
      className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none placeholder-transparent text-white transition duration-300"
      autoComplete="off"
    />
    <label
      htmlFor="precioVenta"
      className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
    >
      Monto (precio sugerido)
    </label>
  </div>
</motion.div>
        )}

        {/* Datos Técnicos */}
        {activeTab === "tecnicos" && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <h3 className="text-slate-200 text-lg font-semibold mb-2 md:col-span-2">Datos Técnicos</h3>
            
            {[
              { id: "motor", label: "Número de motor*", value: motor, setValue: setMotor, placeholder: "Número completo del motor" },
              { id: "chasis", label: "Número de chasis*", value: chasis, setValue: setChasis, placeholder: "Número completo del chasis" },
              { id: "kilometraje", label: "Kilometraje", value: kilometraje, setValue: setKilometraje, type: "number", placeholder: "Kilómetros recorridos" },
            ].map(({ id, label, value, setValue, type = "text", placeholder = "" }) => (
              <div
                key={id}
                className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70"
              >
                <input
                  id={id}
                  type={type}
                  placeholder={placeholder || " "}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none placeholder-transparent text-white transition duration-300"
                  autoComplete="off"
                  min={type === "number" ? 0 : undefined}
                  required={label.includes("*")}
                />
                <label
                  htmlFor={id}
                  className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
                >
                  {label}
                </label>
              </div>
            ))}

            <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
              <select
                value={combustible}
                onChange={(e) => setCombustible(e.target.value)}
                className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none text-white transition duration-300"
              >
                <option value="Nafta">Nafta</option>
                <option value="Diesel">Diesel</option>
                <option value="Nafta-GNC">Nafta-GNC</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Eléctrico">Eléctrico</option>
              </select>
              <label className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300">
                Tipo de combustible
              </label>
            </div>

            <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
              <select
                value={transmision}
                onChange={(e) => setTransmision(e.target.value)}
                className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none text-white transition duration-300"
              >
                <option value="Manual">Manual</option>
                <option value="Automática">Automática</option>
                <option value="CVT">CVT</option>
              </select>
              <label className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300">
                Transmisión
              </label>
            </div>
          </motion.div>
        )}

        {/* Adicionales */}
        {activeTab === "adicionales" && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-6"
          >
            <h3 className="text-slate-200 text-lg font-semibold mb-2">Información Adicional</h3>
            
            <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none text-white transition duration-300"
              />
              <label className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300">
                Fecha de ingreso
              </label>
            </div>

            <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
              <select
                value={documentacion}
                onChange={(e) => setDocumentacion(e.target.value)}
                className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none text-white transition duration-300"
              >
                <option value="Completos">Completos</option>
                <option value="Incompletos">Incompletos</option>
                <option value="En trámite">En trámite</option>
              </select>
              <label className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300">
                Documentación
              </label>
            </div>

            <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder=" "
                className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-indigo-700 focus:outline-none placeholder-transparent text-white transition duration-300 min-h-[100px]"
              />
              <label className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300">
                Observaciones
              </label>
            </div>
          </motion.div>
        )}
      </div>

      {/* Botones */}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <button
          type="submit"
          className={`flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl transition-all duration-200 shadow-md flex-1 ${
            modoEdicion
              ? "bg-green-600 hover:bg-green-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          } hover:scale-[1.02]`}
        >
          <PlusCircle size={18} />
          {modoEdicion ? "Actualizar" : "Agregar Vehículo"}
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
          className={`w-full md:w-48 p-3 rounded-xl bg-slate-800 border-4 rounded bg-slate-700   text-white
    ${
      filtroEtiqueta === ""
        ? "border-red-500 border-l-indigo-500 border-t-green-500 border-b-yellow-500"
        : filtroEtiqueta === "Nuevo"
        ? "border-green-500"
        : filtroEtiqueta === "Usado"
        ? "border-yellow-500"
        : filtroEtiqueta === "Reparación"
        ? "border-red-500"
        : filtroEtiqueta === "Vendido"
        ? "border-slate-500"
        : ""
    }
  `}
          value={filtroEtiqueta}
          onChange={(e) => setFiltroEtiqueta(e.target.value)}
        >
          <option value="">🔍 Etiqueta</option>
          <option value="Nuevo">Nuevo (0KM)</option>
          <option value="Usado">Usado</option>
          <option value="Vendido">Vendido</option>
          <option value="Reparación">Reparación</option>
        </select>

        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-3 rounded bg-indigo-700 hover:bg-indigo-800 text-white transition"
          aria-label="Exportar vehículos CSV"
        >
          <Download size={18} />
          Exportar Listado
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
                <h3 className="text-xl font-bold text-white">
                  {vehiculo.marca} {vehiculo.modelo} * {vehiculo.patente || "-"}
                </h3>
                {vehiculo.etiqueta && (
                  <span
                    className={`ml-2 px-3 py-0.5 rounded-full text-xs font-semibold ${colorEtiqueta(
                      vehiculo.etiqueta
                    )} text-white`}
                  >
                    {vehiculo.etiqueta}
                  </span>
                )}
              </div>
              {/* Datos principales */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-yellow-400" />
                  <strong className="text-slate-300">Patente:</strong>
                  <span>{vehiculo.patente || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-indigo-400" />
                  <strong className="text-slate-300">Estado:</strong>
                  <span>{vehiculo.estado || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <strong className="text-slate-300">Tipo:</strong>
                  <span>{vehiculo.tipo || "-"}</span>
                </div>
                {vehiculo.monto && vehiculo.etiqueta === "Vendido" && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <strong className="text-slate-300">Vendido a:</strong>
                    <strong className="text-lime-400">
                      {vehiculo.monto.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                      })}
                    </strong>
                  </div>
                )}
                {vehiculo.precioVenta && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <strong className="text-slate-300">Precio Sugerido:</strong>
                    <strong className="text-indigo-400">
                      {vehiculo.precioVenta.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                      })}
                    </strong>
                  </div>
                )}
                {vehiculo.precioCompra && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <strong className="text-slate-300">Precio Tomado:</strong>
                    <strong className="text-yellow-400">
                      {vehiculo.precioCompra.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                      })}
                    </strong>
                  </div>
                )}

                {preciosPorVehiculo[vehiculo.id] !== undefined && (
                  <div className="flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-orange-400" />
                    <strong className="text-slate-300">Gastos:</strong>
                    <strong className="text-orange-600">
                      {preciosPorVehiculo[vehiculo.id].toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                      })}
                    </strong>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-orange-400" />
                  <strong className="text-slate-300">N° Chasis:</strong>
                  <span>{vehiculo.chasis || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GaugeCircle className="w-4 h-4 text-red-400" />
                  <strong className="text-slate-300">N° Motor:</strong>
                  <span>{vehiculo.motor || "-"}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  <span>Año: {vehiculo.año || "-"}</span>
                </div>
              </div>

              {/* Cliente y Taller */}
              <div className="mt-2 text-sm text-slate-300 space-y-1">
                {vehiculo.clienteId && (
                  <div className="flex items-center gap-2 text-indigo-300">
                    <User className="w-4 h-4" />
                    <span>
                      Cliente Dueño: {vehiculo.clienteNombre}{" "}
                      {vehiculo.clienteApellido}
                    </span>
                  </div>
                )}
                {vehiculo.tallerId && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Factory className="w-4 h-4" />
                    <span>
                      Taller:{" "}
                      {talleres.find((t) => t.id === vehiculo.tallerId)
                        ?.nombre || "Desconocido"}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-600">
                <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                  Datos de La Compra/Venta
                </h4>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserCircle className="text-blue-500" size={16} />
                    <span>
                      <strong className="text-blue-500">Tomado por:</strong>{" "}
                      {vehiculo.tomadoPor || "—"} ·{" "}
                      {vehiculo.tomadoEn
                        ? new Date(
                            vehiculo.tomadoEn.seconds * 1000
                          ).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShoppingCart className="text-green-500" size={16} />
                    <span>
                      <strong className="text-green-500">Vendido por:</strong>{" "}
                      {vehiculo.vendidoPor || "—"} ·{" "}
                      {vehiculo.vendidoEn
                        ? new Date(
                            vehiculo.vendidoEn.seconds * 1000
                          ).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FilePlus className="text-indigo-500" size={16} />
                    <span>
                      <strong className="text-indigo-500">Creado por:</strong>{" "}
                      {vehiculo.creadoPor || "—"} ·{" "}
                      {vehiculo.creadoEn
                        ? new Date(
                            vehiculo.creadoEn.seconds * 1000
                          ).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                  {vehiculo.modificadoPor && (
                    <div className="flex items-center gap-2">
                      <Hammer className="text-yellow-500" size={16} />
                      <span>
                        <strong className="text-yellow-500">
                          Modificado por:
                        </strong>{" "}
                        {vehiculo.modificadoPor} ·{" "}
                        {vehiculo.modificadoEn
                          ? new Date(
                              vehiculo.modificadoEn.seconds * 1000
                            ).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  )}
                </div>
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
                <button
            onClick={() => abrirModalDetalles(vehiculo)}
            className="text-blue-400 hover:text-blue-600"
          >
            <Eye />
          </button>
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
      {mostrarExportacion && (
        <ExportarVehiculos
          vehiculos={vehiculosPaginados}
          onClose={() => setMostrarExportacion(false)}
        />
      )}

      
      {/* Modal de detalles */}
      <DetallesVehiculoModal
        vehiculo={vehiculoSeleccionado}
        isOpen={modalDetallesAbierto}
        onClose={() => setModalDetallesAbierto(false)}
        talleres={talleres}
        preciosPorVehiculo={preciosPorVehiculo}
      />  
    </div>
    
  );
}
