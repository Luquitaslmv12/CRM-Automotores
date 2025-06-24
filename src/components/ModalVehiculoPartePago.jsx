import { useState, useEffect } from "react";
import { db } from "../firebase"; // tu configuración
import { collection, getDocs } from "firebase/firestore";

export default function ModalVehiculoPartePago({ onClose, onSave }) {
  const [usuarios, setUsuarios] = useState([]);
const [recibidoPor, setRecibidoPor] = useState("");


useEffect(() => {
  const fetchUsuarios = async () => {
    const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
    const usuariosList = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsuarios(usuariosList);
  };

  fetchUsuarios();
}, []);

 const [vehiculo, setVehiculo] = useState({
  marca: "",
  modelo: "",
  año: "",
  color: "",
  monto: "",
  patente: "",
  tipo: "",
});

  const handleChange = (e) => {
    setVehiculo({ ...vehiculo, [e.target.name]: e.target.value });
  };

const handleSubmit = (e) => {
  e.preventDefault();
  onSave({
    ...vehiculo,
    recibidoPor,
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

        <label className="text-white block mb-2">Recibido por:</label>
<select
  value={recibidoPor}
  onChange={(e) => setRecibidoPor(e.target.value)}
  className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
  required
>
  <option value="">Seleccione un usuario</option>
  {usuarios.map((usuario) => (
    <option key={usuario.id} value={usuario.nombre}>
      {usuario.nombre}
    </option>
  ))}
</select> 

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
          name="tipo"
          placeholder="Tipo"
          value={vehiculo.tipo}
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
/>

{/* Vista del monto en formato pesos */}
{vehiculo.monto && (
  <p className="text-sm text-lime-400 font-mono">
    {Number(vehiculo.monto).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })}
  </p>
)}
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
