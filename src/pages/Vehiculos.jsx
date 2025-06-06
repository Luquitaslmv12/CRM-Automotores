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
  Truck,
  Pencil,
  Trash2,
  PlusCircle,
  XCircle,
  Download,
  Search,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function Vehiculos() {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [patente, setPatente] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [toast, setToast] = useState(null);
  const formRef = useRef(null);
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'vehiculos'), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVehiculos(lista);
    });
    return () => unsubscribe();
  }, []);

  const limpiarFormulario = () => {
    setMarca('');
    setModelo('');
    setPatente('');
    setEstado('');
    setTipo('');
    setPrecioVenta('');
    setEtiqueta('');
    setModoEdicion(false);
    setIdEditar(null);
  };

  const mostrarToast = (mensaje, tipo = 'ok') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const guardarVehiculo = async () => {
    if (!marca || !modelo || !patente) {
      mostrarToast('Marca, Modelo y Patente son obligatorios', 'error');
      return;
    }

    try {
      if (modoEdicion) {
        await updateDoc(doc(db, 'vehiculos', idEditar), {
          marca,
          modelo,
          patente,
          estado,
          tipo,
          precioVenta: Number(precioVenta) || 0,
          etiqueta,
        });
        mostrarToast('Vehículo actualizado');
      } else {
        await addDoc(collection(db, 'vehiculos'), {
          marca,
          modelo,
          patente,
          estado,
          tipo,
          precioVenta: Number(precioVenta) || 0,
          etiqueta,
          fechaRegistro: new Date(),
        });
        mostrarToast('Vehículo agregado');
      }
      limpiarFormulario();
    } catch (err) {
      console.error(err);
      mostrarToast('Error al guardar vehículo', 'error');
    }
  };

  const eliminarVehiculo = (id) => {
    setConfirmacion({ tipo: 'eliminar', id });
  };

  const confirmarEliminar = async () => {
    try {
      await deleteDoc(doc(db, 'vehiculos', confirmacion.id));
      mostrarToast('Vehículo eliminado');
      setConfirmacion(null);
    } catch (err) {
      console.error(err);
      mostrarToast('Error al eliminar vehículo', 'error');
    }
  };

  const cancelarEdicion = () => {
    limpiarFormulario();
  };

  const editarVehiculo = (vehiculo) => {
    setMarca(vehiculo.marca || '');
    setModelo(vehiculo.modelo || '');
    setPatente(vehiculo.patente || '');
    setEstado(vehiculo.estado || '');
    setTipo(vehiculo.tipo || '');
    setPrecioVenta(vehiculo.precioVenta ? vehiculo.precioVenta.toString() : '');
    setEtiqueta(vehiculo.etiqueta || '');
    setIdEditar(vehiculo.id);
    setModoEdicion(true);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const exportarCSV = () => {
    setConfirmacion({ tipo: 'exportar' });
  };

  const confirmarExportar = () => {
    const headers = ['Marca', 'Modelo', 'Patente', 'Estado', 'Tipo', 'Precio Venta', 'Etiqueta'];
    const rows = vehiculos.map((v) => [
      v.marca,
      v.modelo,
      v.patente,
      v.estado || '',
      v.tipo || '',
      v.precioVenta || '',
      v.etiqueta || '',
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehiculos.csv';
    a.click();
    URL.revokeObjectURL(url);

    mostrarToast('Exportación realizada');
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
      case 'Nuevo':
        return 'bg-green-600';
      case 'Usado':
        return 'bg-yellow-500';
      case 'Reparación':
        return 'bg-red-600';
      case 'Vendido':
        return 'bg-gray-500';
      default:
        return 'bg-indigo-600';
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">Gestión de Vehículos</h1>

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
                    ? '¿Eliminar vehículo?'
                    : '¿Exportar vehículos?'}
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
      {modoEdicion ? 'Editar Vehiculo' : 'Agregar Vehiculo'}
    </h2>
  </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Marca *"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
            required
          />
          <input
            type="text"
            placeholder="Modelo *"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
            required
          />
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
          <input
            type="number"
            placeholder="Precio de Venta"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            className="p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 col-span-1"
            min="0"
            step="any"
          />
          <select
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            className="input col-span-1 md:col-span-2"
          >
            <option value="">Etiqueta</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Usado">Usado</option>
            <option value="Reparación">Reparación</option>
            <option value="Vendido">Vendido</option>
          </select>
        </div>

        <div className="flex gap-4">
    <button
      onClick={guardarVehiculo}
      className={`flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg transition flex-1
        ${modoEdicion ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-700 hover:bg-indigo-800'}`}
    >
      <PlusCircle size={18} /> {modoEdicion ? 'Actualizar' : 'Agregar Cliente'}
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
              onClick={() => setBusqueda('')}
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
      
      <motion.div
        layout
        className="max-w-3xl mx-auto rounded-xl shadow-lg bg-slate-900 overflow-hidden"
      >
        <div className="grid grid-cols-[3fr_3fr_2fr_2fr_1fr_1fr_1fr] gap-4 text-indigo-300 font-semibold px-6 py-3 border-b border-indigo-700">
          <div>Marca</div>
          <div>Modelo</div>
          <div>Patente</div>
          <div>Estado</div>
          <div>Tipo</div>
          <div>Precio Venta</div>
          <div>Etiqueta</div>
          <div></div>
        </div>
        <AnimatePresence>
          {vehiculosPaginados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center text-slate-400"
            >
              No hay vehículos para mostrar.
            </motion.div>
          ) : (
            vehiculosPaginados.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                layout
                className="grid grid-cols-[3fr_3fr_2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center border-b border-indigo-800 px-6 py-3 text-white hover:bg-indigo-900/20 transition cursor-default"
              >
                <div>{v.marca}</div>
                <div>{v.modelo}</div>
                <div className="uppercase">{v.patente}</div>
                <div>{v.estado || '-'}</div>
                <div>{v.tipo || '-'}</div>
                <div>${v.precioVenta?.toLocaleString() || '-'}</div>
                <div>
                  {v.etiqueta && (
                    <span
                      className={`px-2 py-0.5 rounded text-sm ${colorEtiqueta(
                        v.etiqueta
                      )}`}
                    >
                      {v.etiqueta}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editarVehiculo(v)}
                    aria-label="Editar vehículo"
                    className="text-indigo-400 hover:text-indigo-600"
                  >
                    <Pencil />
                  </button>
                  <button
                    onClick={() => eliminarVehiculo(v.id)}
                    aria-label="Eliminar vehículo"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

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
