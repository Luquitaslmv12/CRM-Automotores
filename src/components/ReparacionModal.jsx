import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  updateDoc,
  doc,
  collection,
  getDocs,
} from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";

export default function ReparacionModal({
  abierto,
  cerrar,
  reparacionActual,
  proveedorId,
  onSave,
}) {
  const [vehiculoId, setVehiculoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("Reparación");
  const [precio, setPrecio] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [vehiculos, setVehiculos] = useState([]);

  useEffect(() => {
    const fetchVehiculos = async () => {
      const snapshot = await getDocs(collection(db, "vehiculos"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVehiculos(data);
    };

    fetchVehiculos();
  }, []);

  useEffect(() => {
    if (reparacionActual) {
      setVehiculoId(reparacionActual.vehiculoId || "");
      setDescripcion(reparacionActual.descripcionReparacion || "");
      setEstado(reparacionActual.estado || "Reparación");
      setPrecio(reparacionActual.precioServicio || "");
      setFechaIngreso(
        reparacionActual.fechaIngreso?.toDate?.().toISOString().slice(0, 16) || ""
      );
      setFechaSalida(
        reparacionActual.fechaSalida?.toDate?.().toISOString().slice(0, 16) || ""
      );
    } else {
      setVehiculoId("");
      setDescripcion("");
      setEstado("Reparación");
      setPrecio("");
      setFechaIngreso("");
      setFechaSalida("");
    }
  }, [reparacionActual]);

  const guardar = async () => {
    const data = {
      vehiculoId,
      descripcionReparacion: descripcion,
      estado,
      precioServicio: parseFloat(precio),
      tallerId: proveedorId,
      fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null,
      fechaSalida: fechaSalida ? new Date(fechaSalida) : null,
      modificadoPor: "lucas@gmail.com", // puedes usar user.email si usas auth
    };

    if (reparacionActual) {
      await updateDoc(doc(db, "reparaciones", reparacionActual.id), data);
      onSave({ ...reparacionActual, ...data });
    } else {
      const docRef = await addDoc(collection(db, "reparaciones"), data);
      onSave({ id: docRef.id, ...data });
    }

    cerrar();
  };

  return (
    <Dialog open={abierto} onClose={cerrar} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-slate-800 p-6 text-white shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold">
              {reparacionActual ? "Editar Reparación" : "Nueva Reparación"}
            </Dialog.Title>
            <button onClick={cerrar}>
              <X className="text-white" />
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label>Vehículo</label>
              <select
                className="w-full bg-slate-700 p-2 rounded mt-1"
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
              >
                <option value="">Seleccionar vehículo</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} - {v.patente}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Descripción del trabajo</label>
              <textarea
                className="w-full bg-slate-700 p-2 rounded mt-1"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div>
              <label>Estado</label>
              <select
                className="w-full bg-slate-700 p-2 rounded mt-1"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Reparación">Reparación</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>

            <div>
              <label>Precio</label>
              <input
                type="number"
                className="w-full bg-slate-700 p-2 rounded mt-1"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>

            <div>
              <label>Fecha de ingreso</label>
              <input
                type="datetime-local"
                className="w-full bg-slate-700 p-2 rounded mt-1"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
              />
            </div>

            <div>
              <label>Fecha de salida</label>
              <input
                type="datetime-local"
                className="w-full bg-slate-700 p-2 rounded mt-1"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={guardar}
              disabled={!vehiculoId || !descripcion || !precio}
            >
              Guardar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
