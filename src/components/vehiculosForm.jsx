import React, { useState, useEffect } from 'react';

export default function VehiculosForm({
  marcas,
  modelos,
  onAdd,
  onUpdate,
  editingVehiculo,
  setEditingVehiculo
}) {
  const [marcaId, setMarcaId] = useState('');
  const [modeloId, setModeloId] = useState('');
  const [patente, setPatente] = useState('');
  const [estado, setEstado] = useState('disponible');
  const [tipo, setTipo] = useState('camion');

  useEffect(() => {
    if (editingVehiculo) {
      setMarcaId(editingVehiculo.marcaId || '');
      setModeloId(editingVehiculo.modeloId || '');
      setPatente(editingVehiculo.patente || '');
      setEstado(editingVehiculo.estado || 'disponible');
      setTipo(editingVehiculo.tipo || 'camion');
    } else {
      resetForm();
    }
  }, [editingVehiculo]);

  const resetForm = () => {
    setMarcaId('');
    setModeloId('');
    setPatente('');
    setEstado('disponible');
    setTipo('camion');
  };

  const filteredModelos = modelos.filter((m) => m.marcaId === marcaId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!marcaId || !modeloId || !patente) return;

    const data = { marcaId, modeloId, patente, estado, tipo };

    if (editingVehiculo) {
      onUpdate(editingVehiculo.id, data);
    } else {
      onAdd(data);
    }
    resetForm();
    setEditingVehiculo(null);
  };

  return (
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
          </div>
          <select
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none text-white mb-6 focus:ring-2 focus:ring-indigo-400 col-span-1"
          >
            <option value="">Etiqueta</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Usado">Usado</option>
            <option value="Reparación">Reparación</option>
            <option value="Vendido">Vendido</option>
          </select>
        

        <div className="flex gap-4">
    <button
    type="submit"
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
  );
}