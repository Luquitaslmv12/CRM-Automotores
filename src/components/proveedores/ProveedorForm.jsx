import { useState, useEffect } from "react";

export default function ProveedorForm({ initialData, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    tipo: "",
    observaciones: "",
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-4 rounded-xl space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          required
          className="p-2 rounded bg-gray-700 text-white"
        />
        <input
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
          placeholder="Teléfono"
          className="p-2 rounded bg-gray-700 text-white"
        />
        <input
          name="direccion"
          value={form.direccion}
          onChange={handleChange}
          placeholder="Dirección"
          className="p-2 rounded bg-gray-700 text-white"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="p-2 rounded bg-gray-700 text-white"
        />
        <input
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          placeholder="Tipo (ej. Taller)"
          className="p-2 rounded bg-gray-700 text-white"
        />
      </div>
      <textarea
        name="observaciones"
        value={form.observaciones}
        onChange={handleChange}
        placeholder="Observaciones"
        className="w-full p-2 rounded bg-gray-700 text-white"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          className="bg-green-600 px-4 py-2 rounded text-white"
        >
          Guardar
        </button>
        <button
          onClick={onCancelar}
          type="button"
          className="bg-red-600 px-4 py-2 rounded text-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
