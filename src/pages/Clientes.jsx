import { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
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
} from 'lucide-react';

export default function Clientes() {
  const [dni, setDni] = useState('');
const [direccion, setDireccion] = useState('');
const [localidad, setLocalidad] = useState('');
  const [nombre, setNombre] = useState('');
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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClientes(lista);
    });
    return () => unsubscribe();
  }, []);

  const limpiarFormulario = () => {
    setNombre('');
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
    if (!nombre || !email || !telefono) {
      mostrarToast('Todos los campos son obligatorios', 'error');
      return;
    }

    if (!validarEmail(email)) {
      setErrorEmail('Por favor ingresa un email válido.');
      return;
    }

    setErrorEmail('');

    try {
      if (modoEdicion) {
        await updateDoc(doc(db, 'clientes', idEditar), {
          nombre,
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
    setEmail('');
    setTelefono('');
    setEtiqueta('');
    setDni('');
setDireccion('');
setLocalidad('');
  };

  const editarCliente = (cliente) => {
    setNombre(cliente.nombre);
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
    const headers = ['Nombre', 'Email', 'Teléfono', 'Etiqueta'];
    const rows = clientes.map((cliente) => [
      cliente.nombre,
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
    const matchBusqueda = cliente.nombre.toLowerCase().includes(busqueda.toLowerCase());
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

      {/* Formulario */}
<motion.div
  ref={formRef}
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-3xl mx-auto mb-8"
>
  <div className="flex items-center gap-2 mb-4">
    <UserPlus className="text-green-400" />
    <h2 className="text-xl font-semibold">
      {modoEdicion ? 'Editar Cliente' : 'Agregar Cliente'}
    </h2>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <input
      type="text"
      placeholder="Nombre"
      className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
      value={nombre}
      onChange={(e) => setNombre(e.target.value)}
    />
    <input
      type="number"
      placeholder="DNI"
      className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
      value={dni}
      onChange={(e) => setDni(e.target.value)}
    />
    <input
      type="text"
      placeholder="Dirección"
      className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
      value={direccion}
      onChange={(e) => setDireccion(e.target.value)}
    />
    <input
      type="text"
      placeholder="Localidad"
      className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
      value={localidad}
      onChange={(e) => setLocalidad(e.target.value)}
    />
    <input
      type="email"
      placeholder="Email"
      className={`p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1 ${
        errorEmail ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-indigo-400'
      } text-white col-span-1`}
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        if (errorEmail) setErrorEmail('');
      }}
    />
    <input
      type="tel"
      placeholder="Teléfono"
      className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
      value={telefono}
      onChange={(e) => {
        const soloNumeros = e.target.value.replace(/\D/g, '');
        setTelefono(soloNumeros);
      }}
    />
  </div>

  <select
    className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none text-white mb-6 focus:ring-2 focus:ring-indigo-400 col-span-1"
    value={etiqueta}
    onChange={(e) => setEtiqueta(e.target.value)}
  >
    <option value="">Seleccionar etiqueta</option>
    <option value="VIP">VIP</option>
    <option value="Potencial">Potencial</option>
    <option value="Moroso">Moroso</option>
    <option value="Inactivo">Inactivo</option>
  </select>

  {errorEmail && <p className="text-red-500 text-sm mb-4">{errorEmail}</p>}

  <div className="flex gap-4">
    <button
      onClick={guardarCliente}
      className={`flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg transition flex-1
        ${modoEdicion ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-700 hover:bg-indigo-800'}`}
    >
      <UserPlus size={18} /> {modoEdicion ? 'Actualizar' : 'Agregar Cliente'}
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
</motion.div>



      {/* Filtros y botón de exportar */}

      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
  {/* Buscador con icono y botón de limpiar */}
  <div className="relative flex-grow">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 " />
    <input
      type="text"
      placeholder="Buscar por nombre..."
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
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
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
                <p className="text-lg font-semibold">{cliente.nombre}</p>
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
                  <p
                    className={`text-xs inline-block mt-1 px-2 py-1 rounded-full text-white ${colorEtiqueta(cliente.etiqueta)}`}
                  >
                    {cliente.etiqueta}
                  </p>
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
    </div>
  );
}
