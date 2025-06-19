import { useState } from "react";
import BuscadorCliente from "../BuscadorCliente";
import BuscadorVehiculo from "../BuscadorVehiculo";
import BuscadorTalleres from "../BuscadorTalleres";

export default function FormularioMovimiento({ onAgregar }) {
  const [tipo, setTipo] = useState("ingreso");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);


  const [vehiculoId, setVehiculoId] = useState(null);
  const [vehiculoNombre, setVehiculoNombre] = useState("");

  const [proveedorId, setProveedorId] = useState(null);
  const [proveedorNombre, setProveedorNombre] = useState("");

  const clienteNombre = clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}` : '';
 const clienteId = clienteSeleccionado?.id || '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!monto || !descripcion) return alert("Complete monto y descripción");

    onAgregar({
      tipo,
      monto: Number(monto),
      descripcion,
      categoria,
      clienteId,
      clienteNombre,
      vehiculoId,
      proveedorId,
    });

    // Reset
    setMonto("");
    setDescripcion("");
    setCategoria("");
    setClienteId(null);
    setClienteNombre("");
    setVehiculoId(null);
    setVehiculoNombre("");
    setProveedorId(null);
    setProveedorNombre("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4 text-white">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded p-2 bg-gray-700 text-white">
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>

        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto"
          className="rounded p-2 bg-gray-700 text-white"
          min="0"
          step="0.01"
          required
        />

        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción"
          className="rounded p-2 bg-gray-700 text-white"
          required
        />

        <input
          type="text"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Categoría (ej. Reparación)"
          className="rounded p-2 bg-gray-700 text-white"
        />

        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 rounded p-2 font-semibold">
          Agregar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block mb-1">Cliente</label>
          <BuscadorCliente
            selectedId={clienteId}
            onSelect={(id, nombre) => {
              setClienteId(id);
              setClienteNombre(nombre);
            }}
            placeholder="Buscar cliente..."
          />


      <div className="relative">
  <BuscadorCliente
    value={clienteSeleccionado}
    onChange={(cliente) => setClienteSeleccionado(cliente)}
  />

  {clienteSeleccionado && (
    <p className="text-sm text-green-400 mt-1">
      Seleccionado: {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}
    </p>
  )}
</div>
        </div>

        <div>
          <label className="block mb-1">Vehículo</label>
          <BuscadorVehiculo
            selectedId={vehiculoId}
            onSelect={(id, nombre) => {
              setVehiculoId(id);
              setVehiculoNombre(nombre);
            }}
            placeholder="Buscar vehículo..."
          />
          {vehiculoNombre && (
            <p className="text-sm text-green-400 mt-1">Seleccionado: {vehiculoNombre}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Proveedor / Taller</label>
          <BuscadorTalleres
            selectedId={proveedorId}
            onSelect={(id, nombre) => {
              setProveedorId(id);
              setProveedorNombre(nombre);
            }}
            placeholder="Buscar proveedor..."
          />
          {proveedorNombre && (
            <p className="text-sm text-green-400 mt-1">Seleccionado: {proveedorNombre}</p>
          )}
        </div>
      </div>
    </form>
  );
}
