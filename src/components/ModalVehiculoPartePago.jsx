import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import BuscadorCliente from "./BuscadorCliente";

export default function ModalVehiculoPartePago({
  vehiculo,
  onClose,
  onSave,
  modo,
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [recibidoPor, setRecibidoPor] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null); // nuevo

  const [vehiculoState, setVehiculoState] = useState({
    marca: "",
    modelo: "",
    año: "",
    color: "",
    monto: "",
    patente: "",
    tipo: "",
  });

  useEffect(() => {
    const fetchUsuarios = async () => {
      const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
      const usuariosList = usuariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(usuariosList);
    };

    fetchUsuarios();
  }, []);

  // Cargar datos si se edita un vehículo existente
  useEffect(() => {
    if (vehiculo) {
      setVehiculoState({
        marca: vehiculo.marca || "",
        modelo: vehiculo.modelo || "",
        año: vehiculo.año || "",
        color: vehiculo.color || "",
        monto: vehiculo.monto || "",
        patente: vehiculo.patente || "",
        tipo: vehiculo.tipo || "",
      });
      setRecibidoPor(vehiculo.recibidoPor || "");
    }
  }, [vehiculo]);

  const handleChange = (e) => {
    setVehiculoState({ ...vehiculoState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...vehiculoState,
      recibidoPor,
      cliente: clienteSeleccionado,
      fechaEntrega: new Date(),
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose} // click afuera cierra modal
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()} // evita cierre al click dentro
        className="bg-slate-800 p-6 rounded-2xl shadow-xl max-w-lg w-full"
      >
        <h3 className="text-xl font-semibold mb-4 text-white">
          Datos del vehículo de compra / parte de pago
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

        {/* Mostrar buscador solo si modo es compra */}
        {modo === "compra" && (
          <>
            <label className="text-white block mb-2">Asignar Cliente:</label>
            <BuscadorCliente
              value={clienteSeleccionado}
              onChange={setClienteSeleccionado}
              placeholder="Dueño del vehiculo"
            />
          </>
        )}

        <input
          name="marca"
          placeholder="Marca"
          value={vehiculoState.marca}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
          required
        />
        <input
          name="patente"
          placeholder="Patente"
          value={vehiculoState.patente}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
        />
        <input
          name="modelo"
          placeholder="Modelo"
          value={vehiculoState.modelo}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
          required
        />
        <input
          name="tipo"
          placeholder="Tipo"
          value={vehiculoState.tipo}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
          required
        />
        <input
          name="monto"
          type="number"
          step="0.01"
          placeholder="Monto tomado"
          value={vehiculoState.monto}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
        />

        {vehiculoState.monto && (
          <p className="text-sm text-lime-400 font-mono">
            {Number(vehiculoState.monto).toLocaleString("es-AR", {
              style: "currency",
              currency: "ARS",
            })}
          </p>
        )}

        <input
          name="año"
          type="number"
          placeholder="Año"
          value={vehiculoState.año}
          onChange={handleChange}
          className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
          required
        />
        <input
          name="color"
          placeholder="Color"
          value={vehiculoState.color}
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
