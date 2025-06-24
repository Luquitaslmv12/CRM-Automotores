export default function ProveedorCard({ proveedor, onEditar, onEliminar }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow border-l-4 border-indigo-500 text-sm space-y-1">
      <h2 className="text-lg font-semibold text-indigo-300">{proveedor.nombre}</h2>
      <p><strong>📍</strong> {proveedor.direccion || "Sin dirección"}</p>
      <p><strong>📞</strong> {proveedor.telefono || "Sin teléfono"}</p>
      <p><strong>📧</strong> {proveedor.email || "Sin email"}</p>
      <p><strong>🛠️</strong> {proveedor.tipo || "General"}</p>
      <p className="text-gray-400">{proveedor.observaciones || "Sin observaciones"}</p>
      <div className="flex gap-2 mt-2">
        <button onClick={onEditar} className="text-indigo-400 hover:text-indigo-200 text-xs">Editar</button>
        <button onClick={onEliminar} className="text-red-400 hover:text-red-200 text-xs">Eliminar</button>
      </div>
    </div>
  );
}
