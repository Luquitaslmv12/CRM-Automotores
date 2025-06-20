import { useState, useEffect, useRef } from 'react';
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
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  Trash2,
  UserPlus,
  XCircle,
  Download,
  Search,
  CheckCircle,
  MessageCircle,
  AlertTriangle,
   Truck,
   LoaderCircle,
   Car,
   Plus,
} from 'lucide-react';
import AsignarVehiculosModal from '../components/AsignarVehiculosModal';
import LocalidadAutocomplete from '../components/LocalidadAutocomplete';




export default function Clientes() {
  const [dni, setDni] = useState('');
const [direccion, setDireccion] = useState('');
const [localidad, setLocalidad] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [errorEmail, setErrorEmail] = useState('');
  const [toast, setToast] = useState(null);
  const formRef = useRef(null);
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;


const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);
const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState([]);
const [vehiculosAsignados, setVehiculosAsignados] = useState([]);

const [loading, setLoading] = useState(false);

const [vehiculoParaQuitar, setVehiculoParaQuitar] = useState(null);
const [vehiculoEnConfirmacion, setVehiculoEnConfirmacion] = useState(null);



 const nombreRef = useRef();

  useEffect(() => {
    if (!modoEdicion && nombreRef.current) {
      nombreRef.current.focus();
    }
  }, [modoEdicion]);

  // Función para validar solo letras
  const soloLetras = (value) =>
    value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');

  // Función para validar solo números (teléfono)
  const soloNumeros = (value) =>
    value.replace(/\D/g, '');





const abrirAsignarVehiculo = async (cliente) => {
  setClienteSeleccionado(cliente);

  // Buscar vehículos disponibles (no asignados)
  const q = query(collection(db, 'vehiculos'), where('clienteId', '==', null));
  const snapshot = await getDocs(q);
  const disponibles = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  setVehiculosDisponibles(disponibles);

  // Buscar vehículos ya asignados al cliente
  const qAsignados = query(collection(db, 'vehiculos'), where('clienteId', '==', cliente.id));
  const snapshotAsignados = await getDocs(qAsignados);
  const asignados = snapshotAsignados.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  setVehiculosAsignados(asignados); // crea este nuevo estado

  setVehiculosSeleccionados([]);
};

const asignarVehiculos = async () => {
  try {
    const updates = vehiculosSeleccionados.map((vehiculoId) =>
      updateDoc(doc(db, 'vehiculos', vehiculoId), {
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
    mostrarToast('Vehículos asignados con éxito');
  } catch (error) {
    console.error(error);
    mostrarToast('Error al asignar vehículos', 'error');
  }
};


const quitarVehiculoAsignado = async (vehiculoId) => {
  try {
    await updateDoc(doc(db, 'vehiculos', vehiculoId), {
      clienteId: null,
    });

    // Eliminar de los asignados
    setVehiculosAsignados((prev) => prev.filter((v) => v.id !== vehiculoId));

    // Obtener los datos actualizados
    const docRef = await getDoc(doc(db, 'vehiculos', vehiculoId));
    setVehiculosDisponibles((prev) => [...prev, { id: vehiculoId, ...docRef.data() }]);

    mostrarToast('Vehículo desvinculado con éxito');

    // Reset confirmación
    setVehiculoEnConfirmacion(null);
  } catch (error) {
    console.error(error);
    mostrarToast('Error al quitar el vehículo', 'error');
  }
};


  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClientes(lista);
    });
    return () => unsubscribe();
  }, []);

  const limpiarFormulario = () => {
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefono('');
    setEtiqueta('');
    setModoEdicion(false);
    setIdEditar(null);
    setDni('');
setDireccion('');
setLocalidad('');
  };

  const mostrarToast = (mensaje, tipo = 'ok') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const guardarCliente = async () => {
  if (!nombre || !apellido || !email || !telefono || !dni) {
    mostrarToast('Todos los campos son obligatorios', 'error');
    return;
  }
  if (!validarEmail(email)) {
    setErrorEmail('Por favor ingresa un email válido.');
    return;
  }
 
  setErrorEmail('');

   try {
    // Verificar si ya existe un cliente con el mismo DNI
    const clientesRef = collection(db, 'clientes');
    const q = query(clientesRef, where('dni', '==', dni));
    const querySnapshot = await getDocs(q);
    if (!modoEdicion) {
      if (!querySnapshot.empty) {
        mostrarToast('Ya existe un cliente con este DNI', 'error');
        return;
      }
    } else {
      // Si estamos en modo edición, permitir el mismo DNI solo si es el del cliente que estamos editando
      if (!querySnapshot.empty) {
        const clienteConMismoDNI = querySnapshot.docs[0].data();
        if (querySnapshot.docs[0].id !== idEditar) {
          mostrarToast('Ya existe otro cliente con este DNI', 'error');
          return;
        }
      }
    }

     if (modoEdicion) {
      await updateDoc(doc(db, 'clientes', idEditar), {
        nombre,
        apellido,
        email,
        telefono,
        etiqueta,
        dni,
        direccion,
        localidad,
      });
      mostrarToast('Cliente actualizado');
    } else {
      await addDoc(collection(db, 'clientes'), {
        nombre,
        apellido,
        email,
        telefono,
        etiqueta,
        dni,
        direccion,
        localidad,
        fechaRegistro: new Date(),
      });
      mostrarToast('Cliente agregado');
    }
    limpiarFormulario();
  } catch (err) {
    console.error(err);
    mostrarToast('Error al guardar cliente', 'error');
  }
};

  const eliminarCliente = async (id) => {
    setConfirmacion({ tipo: 'eliminar', id });
  };

  const confirmarEliminar = async () => {
    try {
      await deleteDoc(doc(db, 'clientes', confirmacion.id));
      mostrarToast('Cliente eliminado');
      setConfirmacion(null);
    } catch (err) {
      console.error(err);
      mostrarToast('Error al eliminar', 'error');
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefono('');
    setEtiqueta('');
    setDni('');
setDireccion('');
setLocalidad('');
  };

  const editarCliente = (cliente) => {
    setNombre(cliente.nombre);
    setApellido(cliente.apellido);
    setEmail(cliente.email);
    setTelefono(cliente.telefono);
    setEtiqueta(cliente.etiqueta || '');
    setIdEditar(cliente.id);
    setModoEdicion(true);
    setDni(cliente.dni || '');
setDireccion(cliente.direccion || '');
setLocalidad(cliente.localidad || '');

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const exportarCSV = () => {
    setConfirmacion({ tipo: 'exportar' });
  };

  const confirmarExportar = () => {
    const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Etiqueta'];
    const rows = clientes.map((cliente) => [
      cliente.nombre,
      cliente.apellido,
      cliente.email,
      cliente.telefono,
      cliente.etiqueta || '',
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.csv';
    a.click();
    URL.revokeObjectURL(url);

    mostrarToast('Exportación realizada');
    setConfirmacion(null);
  };

  const resultados = clientes.filter((cliente) => {
  if (!cliente) return false;

  const texto = busqueda.trim().toLowerCase();

  // Dividir lo que el usuario escribe en palabras separadas
  const palabrasBusqueda = texto.split(/\s+/);

  // Combinar los campos relevantes del cliente
  const contenidoCliente = `${cliente.nombre || ''} ${cliente.apellido || ''} ${cliente.dni || ''}`.toLowerCase();

  // Verificar que todas las palabras aparezcan en el contenido del cliente
  const matchBusqueda = palabrasBusqueda.every((palabra) =>
    contenidoCliente.includes(palabra)
  );

  const matchEtiqueta = !filtroEtiqueta || cliente.etiqueta === filtroEtiqueta;

  return matchBusqueda && matchEtiqueta;
});


  const totalPaginas = Math.ceil(resultados.length / itemsPorPagina);
  const clientesPaginados = resultados.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  );

  const colorEtiqueta = (etiqueta) => {
    switch (etiqueta) {
      case 'VIP':
        return 'bg-green-600';
      case 'Potencial':
        return 'bg-yellow-500';
      case 'Moroso':
        return 'bg-red-600';
      case 'Inactivo':
        return 'bg-gray-500';
      default:
        return 'bg-indigo-600';
    }
  };


  const esMovil = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const generarLinkWhatsApp = (numero) => {
  const limpio = numero.replace(/\D/g, '');
  const base = esMovil() ? 'https://api.whatsapp.com/send?phone=' : 'https://web.whatsapp.com/send?phone=';
  return `${base}${limpio}`;
};

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">Gestión de Clientes</h1>

      {/* Toast notificación */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
              toast.tipo === 'error' ? 'bg-red-600' : 'bg-green-600'
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
                  {confirmacion.tipo === 'eliminar'
                    ? '¿Eliminar cliente?'
                    : '¿Exportar clientes?'}
                </h2>
              </div>
              <p>
                {confirmacion.tipo === 'eliminar'
                  ? 'Esta acción no se puede deshacer.'
                  : 'Se descargará un archivo CSV.'}
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
                    confirmacion.tipo === 'eliminar'
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

      <motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-slate-900 p-8 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto mb-10 border border-slate-700"
>
  <div className="flex items-center gap-2 mb-6">
    <UserPlus className="text-green-400" />
    <h2 className="text-2xl font-bold text-white tracking-wide">
      {modoEdicion ? 'Editar Cliente' : 'Agregar Cliente'}
    </h2>
  </div>

  {/* --- Datos personales --- */}
  <h3 className="text-slate-200 text-sm font-semibold mb-2 mt-6">Datos personales</h3>
  <div className="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Campo genérico */}
    {[{
      id: 'nombre', value: nombre, setValue: setNombre, label: 'Nombre', handler: soloLetras
    }, {
      id: 'apellido', value: apellido, setValue: setApellido, label: 'Apellido', handler: soloLetras, ref: nombreRef
    }, {
      id: 'dni', value: dni, setValue: setDni, label: 'DNI', type: 'number'
    }].map(({ id, value, setValue, label, type = 'text', handler, ref }, i) => (
      <div key={id} className="relative focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-xl transition">
        <input
          {...(ref ? { ref } : {})}
          id={id}
          type={type}
          placeholder=" "
          value={value}
          onChange={(e) => setValue(handler ? handler(e.target.value) : e.target.value)}
          className="peer p-3 pt-5 w-full rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-transparent text-white transition"
          autoComplete="off"
        />
        <label
          htmlFor={id}
          className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
        >
          {label}
        </label>
      </div>
    ))}
  </div>

 <h3 className="text-slate-200 text-sm font-semibold mb-2 mt-6">Dirección</h3>
<div className="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
  
  {/* Localidad: columna 1 (1/3 ancho) */}
  <div className="relative md:col-span-2">
    <LocalidadAutocomplete localidad={localidad} setLocalidad={setLocalidad} />
  </div>

  {/* Dirección: columnas 2 y 3 (2/3 ancho) */}
  <div className="relative md:col-span-1 focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-xl transition">
    <input
      id="direccion"
      type="text"
      placeholder=" "
      value={direccion}
      onChange={(e) => setDireccion(e.target.value)}
      className="peer p-3 pt-5 w-full rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-transparent text-white transition"
      autoComplete="off"
    />
    <label
      htmlFor="direccion"
          className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
    >
      Dirección
    </label>
  </div>

</div>

  {/* Contacto */}
  <h3 className="text-slate-200 text-sm font-semibold mb-2 mt-6">Contacto</h3>
  <div className="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Email */}
    <div className="relative focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-xl transition">
      <input
        id="email"
        type="email"
        placeholder=" "
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`peer p-3 pt-5 w-full rounded-xl bg-slate-900 border ${
          errorEmail ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-700 focus:ring-indigo-500/50'
        } focus:outline-none focus:ring-2 placeholder-transparent text-white transition`}
        autoComplete="off"
      />
      <label
        htmlFor="email"
        className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
      >
        Email
      </label>
      {errorEmail && <p className="text-red-500 text-xs mt-1">{errorEmail}</p>}
    </div>

    {/* Teléfono */}
    <div className="relative focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-xl transition">
      <input
        id="telefono"
        type="tel"
        placeholder=" "
        value={telefono}
        onChange={(e) => setTelefono(soloNumeros(e.target.value))}
        className="peer p-3 pt-5 w-full rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-transparent text-white transition"
        autoComplete="off"
      />
      <label
        htmlFor="telefono"
        className="absolute left-3 top-1 text-slate-400 text-sm transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
      >
        Teléfono
      </label>
    </div>

    {/* Etiqueta */}
    <select
      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
      value={etiqueta}
      onChange={(e) => setEtiqueta(e.target.value)}
    >
      <option value="">Seleccionar etiqueta</option>
      <option value="VIP">VIP</option>
      <option value="Potencial">Potencial</option>
      <option value="Moroso">Moroso</option>
      <option value="Inactivo">Inactivo</option>
    </select>
  </div>

  {/* Botones */}
  <div className="flex flex-col md:flex-row gap-4">
    <button
      onClick={guardarCliente}
      disabled={loading}
      className={`flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl transition-all duration-200 shadow-md flex-1
        ${modoEdicion ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
      `}
    >
      {loading ? (
        <>
          <LoaderCircle className="animate-spin" size={18} />
          Guardando...
        </>
      ) : (
        <>
          <UserPlus size={18} />
          {modoEdicion ? 'Actualizar' : 'Agregar Cliente'}
        </>
      )}
    </button>

    {modoEdicion && (
      <button
        onClick={cancelarEdicion}
        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl shadow-md transition-all duration-200 flex-1 hover:scale-[1.02]"
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
          setBusqueda('');
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
    className="bg-slate-700 text-white py-3 px-4 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    value={filtroEtiqueta}
    onChange={(e) => {
      setFiltroEtiqueta(e.target.value);
      setPagina(1);
    }}
  >
    <option value="">Todas las etiquetas</option>
    <option value="VIP">VIP</option>
    <option value="Potencial">Potencial</option>
    <option value="Moroso">Moroso</option>
    <option value="Inactivo">Inactivo</option>
  </select>

  {/* Botón exportar */}
  <button
    onClick={exportarCSV}
    className="flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-3 rounded-lg transition w-full md:w-auto"
  >
    <Download size={18} />
    Exportar CSV
  </button>
</div>

       {/* Lista de clientes */}
      <div className="space-y-3 max-w-3xl mx-auto">
        {clientesPaginados.length === 0 ? (
          <p className="text-center text-slate-400">No hay clientes que coincidan.</p>
        ) : (
          clientesPaginados.map((cliente) => (
            <motion.div
              key={cliente.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-700 p-4 rounded-xl shadow-md flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-semibold">{cliente.nombre} {cliente.apellido}</p>
                <p className="text-sm text-slate-300">
                  {cliente.email} ·{' '}
<a
  href={`tel:${cliente.telefono}`}
  className="text-blue-400 hover:underline"
>
  {cliente.telefono}
</a>{' '}
· DNI: {cliente.dni || '-'} · Localidad: {cliente.localidad || '-'} · Dirección: {cliente.direccion || '-'}
                </p>
               {cliente.etiqueta && (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorEtiqueta(cliente.etiqueta)} text-white`}
  >
    {cliente.etiqueta}
  </span>
)}
              </div>
              <div className="flex gap-3 items-center">
                <a
                  href={generarLinkWhatsApp(cliente.telefono)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-600"
                  aria-label="Enviar WhatsApp"
                >
                  <MessageCircle />
                </a>
                <button
  onClick={() => abrirAsignarVehiculo(cliente)}
  className="text-cyan-400 hover:text-cyan-600"
  aria-label="Asignar vehículo"
>
  <Car />
</button>
                <button
                  onClick={() => editarCliente(cliente)}
                  className="text-indigo-300 hover:text-indigo-500"
                  aria-label="Editar cliente"
                >
                  <Pencil />
                </button>
                <button
                  onClick={() => eliminarCliente(cliente.id)}
                  className="text-red-400 hover:text-red-600"
                  aria-label="Eliminar cliente"
                >
                  <Trash2 />
                </button>
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
          <span className="px-3 py-1">Página {pagina} de {totalPaginas}</span>
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


    </div>
  );
}
