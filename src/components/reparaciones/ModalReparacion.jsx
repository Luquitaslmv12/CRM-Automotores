import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";
import BuscadorVehiculos from "../BuscadorVehiculos";
import BuscadorTalleres from "../BuscadorTalleres";

export default function ModalReparacion({
  vehiculo: vehiculoProp,
  reparacion = null,
  visible,
  onClose,
  onSuccess,
}) {
  const [vehiculo, setVehiculo] = useState(vehiculoProp || null);

  const [talleres, setTalleres] = useState([]);
  const [tallerId, setTallerId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [precio, setPrecio] = useState("");

  // Precargar datos si se está editando
  useEffect(() => {
    if (visible) {
      setVehiculo(vehiculoProp || null);
      setTallerId(reparacion?.tallerId || "");
      setDescripcion(reparacion?.descripcionReparacion || "");
      setFechaIngreso(
        reparacion?.fechaIngreso?.toDate?.().toISOString().slice(0, 10) || ""
      );
      setFechaSalida(
        reparacion?.fechaSalida?.toDate?.().toISOString().slice(0, 10) || ""
      );
      setPrecio(reparacion?.precioServicio?.toString() || "");

      const fetchTalleres = async () => {
        const snapshot = await getDocs(collection(db, "proveedores"));
        setTalleres(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      };
      fetchTalleres();
    }
  }, [visible, vehiculoProp, reparacion]);

  const guardar = async () => {
    if (
      !vehiculo ||
      !tallerId ||
      !descripcion ||
      !fechaIngreso ||
      !fechaSalida ||
      !precio
    ) {
      alert("Por favor, complete todos los campos y seleccione un vehículo.");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const userName = user?.displayName || user?.email || "Desconocido";

      const datosReparacion = {
        vehiculoId: vehiculo.id,
        tallerId,
        descripcionReparacion: descripcion,
        estado: "Reparación",
        fechaIngreso: Timestamp.fromDate(new Date(fechaIngreso)),
        fechaSalida: Timestamp.fromDate(new Date(fechaSalida)),
        precioServicio: Number(precio),
        modificadoPor: userName,
      };

      if (reparacion?.id) {
        // Modo edición
        await updateDoc(doc(db, "reparaciones", reparacion.id), datosReparacion);
      } else {
        // Modo nuevo
        await addDoc(collection(db, "reparaciones"), datosReparacion);

        await updateDoc(doc(db, "vehiculos", vehiculo.id), {
          etiqueta: "Reparación",
          tallerId,
          modificadoPor: userName,
          modificadoEn: Timestamp.now(),
        });
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Error al guardar reparación", error);
      alert("Ocurrió un error al guardar la reparación.");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-center">
          {reparacion ? "Editar Reparación" : "Registrar Reparación"}
        </h2>

        {!vehiculo ? (
          <BuscadorVehiculos onSelect={(v) => setVehiculo(v)} />
        ) : (
          <div className="mb-2 p-2 bg-slate-600 rounded text-white flex justify-between items-center">
            <div>
              Vehículo seleccionado: {vehiculo.patente} - {vehiculo.modelo}
            </div>
            {!vehiculoProp && (
              <button
                onClick={() => setVehiculo(null)}
                className="ml-4 text-red-400 underline"
                type="button"
              >
                Cambiar
              </button>
            )}
          </div>
        )}

        {!tallerId ? (
  <BuscadorTalleres onSelect={(t) => setTallerId(t.id)} />
) : (
  <div className="mb-2 p-2 bg-slate-600 rounded text-white flex justify-between items-center">
    <div>
      Taller seleccionado: {talleres.find(t => t.id === tallerId)?.nombre || "Desconocido"}
    </div>
    <button
      onClick={() => setTallerId("")}
      className="ml-4 text-red-400 underline"
      type="button"
    >
      Cambiar
    </button>
  </div>
)}

        <input
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        />

        <input
          type="date"
          value={fechaIngreso}
          onChange={(e) => setFechaIngreso(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        />

        <input
          type="date"
          value={fechaSalida}
          onChange={(e) => setFechaSalida(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        />

        <input
          type="number"
          placeholder="Precio del servicio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="w-full p-2 border rounded bg-slate-700 text-white"
        />

        <div className="flex justify-between gap-4 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            type="button"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
