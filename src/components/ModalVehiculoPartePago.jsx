import { useState } from "react";
import { db } from "../firebase"; // tu configuración
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

export default function ModalVehiculoPartePago({ onClose, onSave }) {
 const [vehiculo, setVehiculo] = useState({
  marca: "",
  modelo: "",
  año: "",
  color: "",
  monto: "",
  patente: "",
});

  const handleChange = (e) => {
    setVehiculo({ ...vehiculo, [e.target.name]: e.target.value });
  };

const handleSubmit = (e) => {
  e.preventDefault();
  onSave({
    ...vehiculo,
    fechaEntrega: new Date(),
  });
  
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-6 rounded-2xl shadow-xl max-w-lg w-full"
      >
        <h3 className="text-xl font-semibold mb-4 text-white">
          Datos del vehículo entregado en parte de pago
        </h3>

        <input
          name="marca"
          placeholder="Marca"
          value={vehiculo.marca}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
          required
        />
        <input
  name="patente"
  placeholder="Patente"
  value={vehiculo.patente}
  onChange={handleChange}
  className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
/>
        <input
          name="modelo"
          placeholder="Modelo"
          value={vehiculo.modelo}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
          required
        />
        <input
  name="monto"
  type="number"
  step="0.01"
  placeholder="Monto tomado en parte de pago"
  value={vehiculo.monto}
  onChange={handleChange}
  className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
  required
/>
        <input
          name="año"
          type="number"
          placeholder="Año"
          value={vehiculo.año}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
          required
        />
        <input
          name="color"
          placeholder="Color"
          value={vehiculo.color}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white"
          >
            Cancelar
          </button>
          <button
          
            type="submit"
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white"
          >
            Guardar vehículo
          </button>
        </div>
      </form>
    </div>
  );
}
