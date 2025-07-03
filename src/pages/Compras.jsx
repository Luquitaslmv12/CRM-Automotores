import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  addDoc,
  collection,
  where,
  onSnapshot,
  query,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import ModalVehiculoPartePago from "../components/ModalVehiculoPartePago";

export default function NuevaCompra() {
  const [modalOpen, setModalOpen] = useState(false);
  const [vehiculo, setVehiculo] = useState(null);
  const [recibidoPor, setRecibidoPor] = useState("");
  const [clienteAsignado, setClienteAsignado] = useState(null);
  const user = auth.currentUser;

  const [comprasCliente, setComprasCliente] = useState([]);

  useEffect(() => {
    if (!clienteAsignado) {
      setComprasCliente([]);
      return;
    }
    const q = query(
      collection(db, "vehiculos"),
      where("cliente.id", "==", clienteAsignado.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setComprasCliente(datos);
    });
    return () => unsub();
  }, [clienteAsignado]);

  const handleGuardarVehiculo = async () => {
    if (!vehiculo) {
      toast.error("Debes ingresar los datos del vehículo.");
      return;
    }

    const datos = {
      marca: vehiculo.marca || "No especificado",
      modelo: vehiculo.modelo || "No especificado",
      tipo: vehiculo.tipo || "No especificado",
      patente: vehiculo.patente?.toUpperCase() || "No especificado",
      año: parseInt(vehiculo.año) || null,
      color: vehiculo.color || "",
      etiqueta: "Usado",
      tomadoPor: user?.email || "",
      cliente: vehiculo.cliente || null,
      tomadoEn: new Date(),
      monto: parseFloat(vehiculo.monto) || 0,
      precioCompra: parseFloat(vehiculo.monto) || 0,
      estado: "Disponible",
      creadoPor: user?.email || "Desconocido",
      creadoEn: new Date(),
      fechaIngreso: new Date(),
      recibidoPor,
    };

    try {
      // Guardar en "vehiculos"
      await addDoc(collection(db, "vehiculos"), datos);

      // Guardar en "compras"
      await addDoc(collection(db, "compras"), datos);

      toast.success("¡Vehículo ingresado al stock y registrado como compra!");
      setVehiculo(null);
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      toast.error("Error al guardar el vehículo.");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Registrar Compra de Vehículo</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => setModalOpen(true)}
      >
        Cargar Vehículo
      </button>

      {comprasCliente.length > 0 && (
        <div>
          <h2 className="mt-6 font-semibold">
            Compras asignadas a {clienteAsignado.nombre}
          </h2>
          <ul>
            {comprasCliente.map((c) => (
              <li key={c.id}>
                {c.marca} {c.modelo} - ${c.monto.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {vehiculo && (
        <div className="bg-gray-100 p-4 rounded shadow mb-4">
          <p>
            <strong>Marca:</strong> {vehiculo.marca}
          </p>
          <p>
            <strong>Modelo:</strong> {vehiculo.modelo}
          </p>
          <p>
            <strong>Patente:</strong> {vehiculo.patente}
          </p>
          <p>
            <strong>Monto:</strong> ${vehiculo.monto}
          </p>
          {/* otros campos si querés */}
        </div>
      )}

      <label className="block mb-2">
        Recibido por:
        <input
          type="text"
          value={recibidoPor}
          onChange={(e) => setRecibidoPor(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        />
      </label>

      <button
        onClick={handleGuardarVehiculo}
        disabled={!vehiculo}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Registrar Compra
      </button>

      {modalOpen && (
        <ModalVehiculoPartePago
          modo="compra"
          onClose={() => setModalOpen(false)}
          onSave={(v) => {
            setVehiculo(v);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
