import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Trash2,
  UserPlus,
  XCircle,
  Download,
  Search,
  User,
  MessageCircle,
  AlertTriangle,
  Truck,
  LoaderCircle,
  Car,
  Plus,
  Mail,
  Phone,
  IdCard,
  MapPin,
  Home,
} from "lucide-react";
import AsignarVehiculosModal from "../components/AsignarVehiculosModal";
import LocalidadAutocomplete from "../components/LocalidadAutocomplete";
import TooltipWrapper from "../components/Tooltip/TooltipWrapper";
import ExportarClientes from "../components/clientes/ExportarClientes";

export default function Clientes() {
  const [dni, setDni] = useState("");
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEtiqueta, setFiltroEtiqueta] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [errorEmail, setErrorEmail] = useState("");
  const [toast, setToast] = useState(null);
  const formRef = useRef(null);
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;
  const [fechaNacimiento, setFechaNacimiento] = useState("");
const [referencia, setReferencia] = useState("");
const [profesion, setProfesion] = useState("");
const [observaciones, setObservaciones] = useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);
  const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState([]);
  const [vehiculosAsignados, setVehiculosAsignados] = useState([]);

  const [loading, setLoading] = useState(false);

  const [vehiculoParaQuitar, setVehiculoParaQuitar] = useState(null);
  const [vehiculoEnConfirmacion, setVehiculoEnConfirmacion] = useState(null);

  const [mostrarExportacion, setMostrarExportacion] = useState(false);

  const nombreRef = useRef();

  useEffect(() => {
    if (modoEdicion) {
      setTimeout(() => {
        nombreRef.current?.focus();
      }, 350);
    }
  }, [modoEdicion]);

  // Función para validar solo letras
  const soloLetras = (value) => value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");

  // Función para validar solo números (teléfono)
  const soloNumeros = (value) => value.replace(/\D/g, "");

  const abrirAsignarVehiculo = async (cliente) => {
    setClienteSeleccionado(cliente);

    // Buscar vehículos disponibles (no asignados)
    const q = query(
      collection(db, "vehiculos"),
      where("clienteId", "==", null)
    );
    const snapshot = await getDocs(q);
    const disponibles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setVehiculosDisponibles(disponibles);

    // Buscar vehículos ya asignados al cliente
    const qAsignados = query(
      collection(db, "vehiculos"),
      where("clienteId", "==", cliente.id)
    );
    const snapshotAsignados = await getDocs(qAsignados);
    const asignados = snapshotAsignados.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setVehiculosAsignados(asignados); // crea este nuevo estado

    setVehiculosSeleccionados([]);
  };

  const asignarVehiculos = async () => {
    try {
      const updates = vehiculosSeleccionados.map((vehiculoId) =>
        updateDoc(doc(db, "vehiculos", vehiculoId), {
          clienteId: clienteSeleccionado.id,
        })
      );

      await Promise.all(updates);

      // Mover vehículos seleccionados desde disponibles a asignados
      const asignados = vehiculosDisponibles.filter((v) =>
        vehiculosSeleccionados.includes(v.id)
      );

      setVehiculosAsignados((prev) => [...prev, ...asignados]);

      setVehiculosDisponibles((prev) =>
        prev.filter((v) => !vehiculosSeleccionados.includes(v.id))
      );

      setVehiculosSeleccionados([]);
      mostrarToast("Vehículos asignados con éxito");
    } catch (error) {
      console.error(error);
      mostrarToast("Error al asignar vehículos", "error");
    }
  };

  const quitarVehiculoAsignado = async (vehiculoId) => {
    try {
      await updateDoc(doc(db, "vehiculos", vehiculoId), {
        clienteId: null,
      });

      // Eliminar de los asignados
      setVehiculosAsignados((prev) => prev.filter((v) => v.id !== vehiculoId));

      // Obtener los datos actualizados
      const docRef = await getDoc(doc(db, "vehiculos", vehiculoId));
      setVehiculosDisponibles((prev) => [
        ...prev,
        { id: vehiculoId, ...docRef.data() },
      ]);

      mostrarToast("Vehículo desvinculado con éxito");

      // Reset confirmación
      setVehiculoEnConfirmacion(null);
    } catch (error) {
      console.error(error);
      mostrarToast("Error al quitar el vehículo", "error");
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "clientes"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClientes(lista);
    });
    return () => unsubscribe();
  }, []);

  const limpiarFormulario = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    setTelefono("");
    setEtiqueta("");
    setModoEdicion(false);
    setIdEditar(null);
    setDni("");
    setDireccion("");
    setLocalidad("");
    setFechaNacimiento("");
    setReferencia("");
    setProfesion("");
    setObservaciones("");
  };

  const mostrarToast = (mensaje, tipo = "ok") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const guardarCliente = async () => {
    if (!nombre || !apellido || !email || !telefono || !dni) {
      mostrarToast("Todos los campos son obligatorios", "error");
      return;
    }
    if (!validarEmail(email)) {
      setErrorEmail("Por favor ingresa un email válido.");
      return;
    }

    setErrorEmail("");

    try {
      // Verificar si ya existe un cliente con el mismo DNI
      const clientesRef = collection(db, "clientes");
      const q = query(clientesRef, where("dni", "==", dni));
      const querySnapshot = await getDocs(q);
      if (!modoEdicion) {
        if (!querySnapshot.empty) {
          mostrarToast("Ya existe un cliente con este DNI", "error");
          return;
        }
      } else {
        // Si estamos en modo edición, permitir el mismo DNI solo si es el del cliente que estamos editando
        if (!querySnapshot.empty) {
          const clienteConMismoDNI = querySnapshot.docs[0].data();
          if (querySnapshot.docs[0].id !== idEditar) {
            mostrarToast("Ya existe otro cliente con este DNI", "error");
            return;
          }
        }
      }

      if (modoEdicion) {
        await updateDoc(doc(db, "clientes", idEditar), {
          nombre,
          apellido,
          email,
          telefono,
          etiqueta,
          dni,
          direccion,
          localidad,
          fechaNacimiento,
          referencia,
          profesion,
          observaciones,
        });
        mostrarToast("Cliente actualizado");
      } else {
        await addDoc(collection(db, "clientes"), {
          nombre,
          apellido,
          email,
          telefono,
          etiqueta,
          dni,
          direccion,
          localidad,
          fechaRegistro: new Date(),
          fechaNacimiento,
          referencia,
          profesion,
          observaciones,
        });
        mostrarToast("Cliente agregado");
      }
      limpiarFormulario();
    } catch (err) {
      console.error(err);
      mostrarToast("Error al guardar cliente", "error");
    }
  };

  const eliminarCliente = async (id) => {
    setConfirmacion({ tipo: "eliminar", id });
  };

  const confirmarEliminar = async () => {
    try {
      await deleteDoc(doc(db, "clientes", confirmacion.id));
      mostrarToast("Cliente eliminado");
      setConfirmacion(null);
    } catch (err) {
      console.error(err);
      mostrarToast("Error al eliminar", "error");
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setNombre("");
    setApellido("");
    setEmail("");
    setTelefono("");
    setEtiqueta("");
    setDni("");
    setDireccion("");
    setLocalidad("");
    setFechaNacimiento("");
    setReferencia("");
    setProfesion("");
    setObservaciones("");
  };

  const editarCliente = (cliente) => {
    setNombre(cliente.nombre);
    setApellido(cliente.apellido);
    setEmail(cliente.email);
    setTelefono(cliente.telefono);
    setEtiqueta(cliente.etiqueta || "");
    setIdEditar(cliente.id);
    setModoEdicion(true);
    setDni(cliente.dni || "");
    setDireccion(cliente.direccion || "");
    setLocalidad(cliente.localidad || "");
    setFechaNacimiento(cliente.fechaNacimiento || "");
    setReferencia(cliente.referencia || "");
    setProfesion(cliente.profesion || "");
    setObservaciones(cliente.observaciones || "");

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });

      // Dale un pequeño delay para esperar que termine el scroll y el render
      setTimeout(() => {
        nombreRef.current?.focus();
      }, 800);
    }
  };
  const exportarCSV = () => {
    setConfirmacion({ tipo: "exportar" });
  };

  const confirmarExportar = () => {
    const headers = ["Nombre", "Apellido", "Email", "Teléfono", "Etiqueta"];
    const rows = clientes.map((cliente) => [
      cliente.nombre,
      cliente.apellido,
      cliente.email,
      cliente.telefono,
      cliente.etiqueta || "",
      cliente.fechaNacimiento || "",
      cliente.referencia || "",
      cliente.profesion || "",
      cliente.observaciones || "",
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes.csv";
    a.click();
    URL.revokeObjectURL(url);

    mostrarToast("Exportación realizada");
    setConfirmacion(null);
  };

  const resultados = clientes.filter((cliente) => {
    if (!cliente) return false;

    const texto = busqueda.trim().toLowerCase();

    // Dividir lo que el usuario escribe en palabras separadas
    const palabrasBusqueda = texto.split(/\s+/);

    // Combinar los campos relevantes del cliente
    const contenidoCliente = `${cliente.nombre || ""} ${
      cliente.apellido || ""
    } ${cliente.dni || ""}`.toLowerCase();

    // Verificar que todas las palabras aparezcan en el contenido del cliente
    const matchBusqueda = palabrasBusqueda.every((palabra) =>
      contenidoCliente.includes(palabra)
    );

    const matchEtiqueta =
      !filtroEtiqueta || cliente.etiqueta === filtroEtiqueta;

    return matchBusqueda && matchEtiqueta;
  });

  const totalPaginas = Math.ceil(resultados.length / itemsPorPagina);
  const clientesPaginados = resultados.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  );

  const colorEtiqueta = (etiqueta) => {
    switch (etiqueta) {
      case "VIP":
        return "bg-green-600";
      case "Potencial":
        return "bg-yellow-500";
      case "Moroso":
        return "bg-red-600";
      case "Inactivo":
        return "bg-gray-500";
      default:
        return "bg-indigo-600";
    }
  };

  const esMovil = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const generarLinkWhatsApp = (numero) => {
    const limpio = numero.replace(/\D/g, "");
    const base = esMovil()
      ? "https://api.whatsapp.com/send?phone="
      : "https://web.whatsapp.com/send?phone=";
    return `${base}${limpio}`;
  };

  return (
    <div className="p-6 pt-18 min-h-screen bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-800 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center flex justify-center items-center gap-2">
        <User className="w-10 h-10 text-sky-500 animate-bounce" />
        Gestión de Clientes
      </h1>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        ref={formRef}
        className="bg-gradient-to-br from-slate-900 via-indigo-900/80 to-slate-900 backdrop-blur-lg p-8 rounded-3xl shadow-[0_0_60px_10px_rgba(8,170,234,0.541)] w-full max-w-4xl mx-auto mb-10 border-3 border-blue-500"
      >
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="text-green-400" />
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {modoEdicion ? "Editar Cliente" : "Agregar Cliente"}
          </h2>
        </div>

        {/* --- Datos personales --- */}
        <h3 className="text-slate-200 text-sm font-semibold mb-4 mt-6">
          Datos personales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              id: "nombre",
              value: nombre,
              setValue: setNombre,
              label: "Nombre",
              handler: soloLetras,
              ref: nombreRef,
            },
            {
              id: "apellido",
              value: apellido,
              setValue: setApellido,
              label: "Apellido",
              handler: soloLetras,
            },
            {
              id: "dni",
              value: dni,
              setValue: setDni,
              label: "DNI",
              type: "number",
            },
          ].map(
            ({ id, value, setValue, label, type = "text", handler, ref }) => (
              <div
                key={id}
                className="relative rounded-xl transition-shadow duration-300
          shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70"
              >
                <input
                  {...(ref ? { ref } : {})}
                  id={id}
                  type={type}
                  placeholder=" "
                  value={value}
                  onChange={(e) =>
                    setValue(handler ? handler(e.target.value) : e.target.value)
                  }
                  className="peer p-3 pt-5 w-full rounded-xl bg-slate-700 border border-slate-700 focus:outline-none placeholder-transparent text-white transition duration-300"
                  autoComplete="off"
                />
                <label
                  htmlFor={id}
                  className="absolute left-3 top-1 text-lime-400 text-sm transition-all
            peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
            peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
                >
                  {label}
                </label>
              </div>
            )
          )}
        </div>

        {/* Dirección */}
      
        <div className="mb-4 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="relative md:col-span-2 rounded-xl transition-shadow duration-300
        shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70"
          >
            <LocalidadAutocomplete
              localidad={localidad}
              setLocalidad={setLocalidad}
            />
          </div>

          <div
            className="relative rounded-xl transition-shadow duration-300
        shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70"
          >
            <input
              id="direccion"
              type="text"
              placeholder=" "
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="peer p-3 pt-5 w-full rounded-xl bg-slate-800 border border-slate-700 focus:outline-none placeholder-transparent text-white transition duration-300"
              autoComplete="off"
            />
            <label
              htmlFor="direccion"
              className="absolute left-3 top-1 text-lime-400 text-sm transition-all
            peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
            peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
            >
              Dirección
            </label>
          </div>
        </div>

        {/* Contacto */}
     
        <div className="mb-4 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email */}
          <div
            className={`relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg
        focus-within:ring-2 ${
          errorEmail ? "ring-red-500 shadow-red-400" : "ring-indigo-500/70"
        }`}
          >
            <input
              id="email"
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`peer p-3 pt-5 w-full rounded-xl bg-slate-800 border ${
                errorEmail ? "border-red-500" : "border-slate-700"
              } focus:outline-none placeholder-transparent text-white transition duration-300`}
              autoComplete="off"
            />
            <label
              htmlFor="email"
              className="absolute left-3 top-1 text-lime-400 text-sm transition-all
            peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
            peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
            >
              Email
            </label>
            {errorEmail && (
              <p className=" text-center text-red-500 text-xs mt-1">
                {errorEmail}
              </p>
            )}
          </div>
          

          {/* Teléfono */}
          <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
            <input
              id="telefono"
              type="tel"
              placeholder=" "
              value={telefono}
              onChange={(e) => setTelefono(soloNumeros(e.target.value))}
              className="peer p-3 pt-5 w-full rounded-xl bg-slate-800 border border-slate-700 focus:outline-none placeholder-transparent text-white transition duration-300"
              autoComplete="off"
            />
            <label
              htmlFor="telefono"
              className="absolute left-3 top-1 text-lime-400 text-sm transition-all
            peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
            peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
            >
              Teléfono
            </label>
          </div>

             {/* Fecha de nacimiento */}
  <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
    <input
      id="fechaNacimiento"
      type="date"
      placeholder=" "
      value={fechaNacimiento}
      onChange={(e) => setFechaNacimiento(e.target.value)}
      className="peer p-3 pt-5 w-full rounded-xl bg-slate-800 border border-slate-700 focus:outline-none placeholder-transparent text-white transition duration-300"
    />
    <label
      htmlFor="fechaNacimiento"
      className="absolute left-3 top-1 text-lime-400 text-sm transition-all
            peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
            peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
    >
      Fecha de nacimiento
    </label>
  </div>
          

           </div>

{/* Datos adicionales */}
<h3 className="text-slate-200 text-sm font-semibold mb-4 mt-6">
  Datos adicionales
</h3>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 
{/* Etiqueta */}
          <select
            className={`w-full p-3 rounded-xl bg-slate-800  text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 transition duration-300
    ${
      etiqueta === ""
        ? "border-indigo-500 "
        : etiqueta === "VIP"
        ? "border-green-500 border-4"
        : etiqueta === "Potencial"
        ? "border-yellow-500 border-4"
        : etiqueta === "Moroso"
        ? "border-red-500 border-4"
        : etiqueta === "Inactivo"
        ? "border-slate-500 border-4"
        : ""
    }
  `}
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
          >
            <option value="">Seleccionar etiqueta 🏷️</option>
            <option value="VIP">VIP</option>
            <option value="Potencial">Potencial</option>
            <option value="Moroso">Moroso</option>
            <option value="Inactivo">Inactivo</option>
          </select>


  {/* Cómo nos conoció */}
  <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
    <select
      id="referencia"
      value={referencia}
      onChange={(e) => setReferencia(e.target.value)}
      className="peer p-3 pt-5 w-full rounded-xl bg-slate-800 border border-slate-700 focus:outline-none text-white transition duration-300 appearance-none"
    >
      <option value="">¿Cómo nos conoció?</option>
      <option value="Redes sociales">Redes sociales</option>
      <option value="Recomendación">Recomendación</option>
      <option value="Publicidad">Publicidad</option>
      <option value="Búsqueda en línea">Búsqueda en línea</option>
      <option value="Otro">Otro</option>
    </select>
    <label
      htmlFor="referencia"
      className="absolute left-3 top-1 text-lime-400 text-sm transition-all
            peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
            peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
    >
      Referencia
    </label>
  </div>

  {/* Profesión */}
  <div className="relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
    <input
      id="profesion"
      type="text"
      placeholder=" "
      value={profesion}
      onChange={(e) => setProfesion(e.target.value)}
      className="peer p-3 pt-5 w-full rounded-xl bg-slate-800 border border-slate-700 focus:outline-none placeholder-transparent text-white transition duration-300"
    />
    <label
      htmlFor="profesion"
      className="absolute left-3 top-1 text-lime-400 text-sm transition-all
            peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
            peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
    >
      Profesión/Ocupación
    </label>
  </div>
</div>

{/* Observaciones */}

<div className="mb-4 mt-6 relative rounded-xl transition-shadow duration-300 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/70">
  <textarea
    id="observaciones"
    placeholder=" "
    value={observaciones}
    onChange={(e) => setObservaciones(e.target.value)}
    className="peer p-3 pt-5 w-full rounded-xl bg-slate-800 border border-slate-700 focus:outline-none placeholder-transparent text-white transition duration-300 min-h-[100px]"
    rows={3}
  />
  <label
    htmlFor="observaciones"
    className="absolute left-3 top-1 text-lime-400 text-sm transition-all
      peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
      peer-focus:top-1 peer-focus:text-sm peer-focus:text-indigo-300"
  >
    Observaciones (notas internas)
  </label>
</div>
       

        {/* Botones */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <button
            onClick={guardarCliente}
            disabled={loading}
            className={`flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl transition-transform duration-200 shadow-md flex-1
        ${
          modoEdicion
            ? "bg-green-600 hover:bg-green-700"
            : "bg-indigo-600 hover:bg-indigo-700"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.03]"}`}
          >
            {loading ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                Guardando...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                {modoEdicion ? "Actualizar" : "Agregar Cliente"}
              </>
            )}
          </button>

          {modoEdicion && (
            <button
              onClick={cancelarEdicion}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl shadow-md transition-transform duration-200 flex-1 hover:scale-[1.03]"
            >
              Cancelar
            </button>
          )}
        </div>
      </motion.div>

      {/* Filtros y botón de exportar */}

      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
        {/* Buscador con icono y botón de limpiar */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 " />
          <input
            type="text"
            placeholder="Buscar por Apellido/Nombre/DNI..."
            className="bg-slate-700 text-white py-3 pl-10 pr-10 w-full rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
          {busqueda && (
            <button
              onClick={() => {
                setBusqueda("");
                setPagina(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-500 transition"
              aria-label="Limpiar búsqueda"
            >
              <XCircle size={20} />
            </button>
          )}
        </div>

        {/* Filtro por etiqueta */}
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
          <option value="VIP">VIP</option>
          <option value="Potencial">Potencial</option>
          <option value="Moroso">Moroso</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        {/* Botón exportar */}
        <button
          onClick={() => setMostrarExportacion(true)}
          className="flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-3 rounded-lg transition w-full md:w-auto"
        >
          <Download size={18} />
          Exportar Listado
        </button>
      </div>

      {/* Lista de clientes */}
      <div className="grid gap-4 md:grid-cols-2 max-w-5xl mx-auto">
        {clientesPaginados.length === 0 ? (
          <p className="text-center col-span-full text-slate-400">
            No hay clientes que coincidan.
          </p>
        ) : (
          clientesPaginados.map((cliente) => (
            <motion.div
              key={cliente.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-gradient-to-br from-slate-800 to-slate-700/70 backdrop-blur-sm border border-slate-600 p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <div className="mb-2 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  {cliente.nombre} {cliente.apellido}
                </h3>
                {cliente.etiqueta && (
                  <span
                    className={`ml-2 px-3 py-0.5 rounded-full text-sm font-semibold ${colorEtiqueta(
                      cliente.etiqueta
                    )} text-white`}
                  >
                    {cliente.etiqueta}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  <span>{cliente.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a
                    href={`tel:${cliente.telefono}`}
                    className="text-blue-400 hover:underline"
                  >
                    {cliente.telefono}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-indigo-400" />
                  <span>DNI: {cliente.dni || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>{cliente.localidad || "-"}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Home className="w-4 h-4 text-yellow-400" />
                  <span>{cliente.direccion || "-"}</span>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-4 text-lg">
                <TooltipWrapper label="Enviar WhatsApp">
                  <a
                    href={generarLinkWhatsApp(cliente.telefono)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-600"
                    aria-label="Enviar WhatsApp"
                  >
                    <MessageCircle />
                  </a>
                </TooltipWrapper>

                <TooltipWrapper label="Asignar / Ver vehículos">
                  <button
                    onClick={() => abrirAsignarVehiculo(cliente)}
                    className="text-cyan-400 hover:text-cyan-600 cursor-pointer"
                  >
                    <Car />
                  </button>
                </TooltipWrapper>

                <TooltipWrapper label="Editar cliente">
                  <button
                    onClick={() => editarCliente(cliente)}
                    className="text-indigo-300 hover:text-indigo-500 cursor-pointer"
                  >
                    <Pencil />
                  </button>
                </TooltipWrapper>

                <TooltipWrapper label="Eliminar cliente">
                  <button
                    onClick={() => eliminarCliente(cliente.id)}
                    className="text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 />
                  </button>
                </TooltipWrapper>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPagina((p) => Math.max(p - 1, 1))}
            disabled={pagina === 1}
            className="px-3 py-1 rounded bg-indigo-700 disabled:bg-indigo-900"
          >
            Anterior
          </button>
          <span className="px-3 py-1">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
            disabled={pagina === totalPaginas}
            className="px-3 py-1 rounded bg-indigo-700 disabled:bg-indigo-900"
          >
            Siguiente
          </button>
        </div>
      )}

      <AsignarVehiculosModal
        clienteSeleccionado={clienteSeleccionado}
        setClienteSeleccionado={setClienteSeleccionado}
        vehiculosDisponibles={vehiculosDisponibles}
        setVehiculosDisponibles={setVehiculosDisponibles}
        vehiculosAsignados={vehiculosAsignados}
        setVehiculosAsignados={setVehiculosAsignados}
        asignarVehiculos={asignarVehiculos}
        vehiculosSeleccionados={vehiculosSeleccionados}
        setVehiculosSeleccionados={setVehiculosSeleccionados}
        vehiculoEnConfirmacion={vehiculoEnConfirmacion}
        setVehiculoEnConfirmacion={setVehiculoEnConfirmacion}
        quitarVehiculoAsignado={quitarVehiculoAsignado}
      />

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
                    ? "¿Eliminar cliente?"
                    : "¿Exportar clientes?"}
                </h2>
              </div>
              <p>
                {confirmacion.tipo === "eliminar"
                  ? "Esta acción no se puede deshacer."
                  : "Se descargara listado de clientes."}
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
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {mostrarExportacion && (
        <ExportarClientes
          clientes={clientesPaginados} // o todos los clientes
          onClose={() => setMostrarExportacion(false)}
        />
      )}
    </div>
  );
}
