import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import Spinner from "../Spinner/Spinner";

export default function ModalNuevaReparacion({
  visible,
  onClose,
  onSuccess,
  reparacion,
}) {
  const [descripcion, setDescripcion] = useState("");
  const [vehiculoId, setVehiculoId] = useState(reparacion?.vehiculoId || "");
  const [tallerId, setTallerId] = useState("");
  const [precioManoObra, setPrecioManoObra] = useState("");
  const [precioRepuestos, setPrecioRepuestos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [vehiculos, setVehiculos] = useState([]);
  const [talleres, setTalleres] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const vehiculoSeleccionado = vehiculos.find(v => v.id === vehiculoId);
const patenteVehiculo = vehiculoSeleccionado?.patente || "";

  useEffect(() => {
    if (!visible) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const vehQuery = query(
          collection(db, "vehiculos"),
          where("etiqueta", "not-in", ["Vendido", "Reparación"])
        );

        const [vehSnap, talSnap] = await Promise.all([
          getDocs(vehQuery),
          getDocs(collection(db, "proveedores")),
        ]);

        let vehiculosData = vehSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Si estás editando y el vehículo asociado no está en la lista, lo traés aparte
        if (
          reparacion?.vehiculoId &&
          !vehiculosData.find((v) => v.id === reparacion.vehiculoId)
        ) {
          const extraVehSnap = await getDocs(
            query(
              collection(db, "vehiculos"),
              where("__name__", "==", reparacion.vehiculoId)
            )
          );
          const extraVehiculos = extraVehSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          vehiculosData = [...vehiculosData, ...extraVehiculos];
        }

        setVehiculos(vehiculosData);
        setTalleres(talSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false); // <-- ACÁ VA SIEMPRE
      } catch (err) {
        console.error("Error fetching data:", err);
        setVehiculos([]);
        setTalleres([]);
      }
    };
    fetchData();
  }, [visible]);

  useEffect(() => {
    if (reparacion) {
      setDescripcion(reparacion.descripcionReparacion || "");
      setVehiculoId(reparacion.vehiculoId || "");
      setTallerId(reparacion.tallerId || "");
      setPrecioManoObra(reparacion.precioManoObra || "");
      setPrecioRepuestos(reparacion.precioRepuestos || "");
      setTelefono(reparacion.telefono || "");
      setObservaciones(reparacion.observaciones || "");
      setError("");
    } else {
      setDescripcion("");
      setVehiculoId("");
      setTallerId("");
      setPrecioManoObra("");
      setPrecioRepuestos("");
      setTelefono("");
      setObservaciones("");
      setError("");
    }
  }, [reparacion, visible]);

  const validar = () => {
    if (!descripcion.trim()) return "La descripción es obligatoria.";
    if (!vehiculoId) return "Debe seleccionar un vehículo.";
    if (!tallerId) return "Debe seleccionar un taller.";

    if (
      precioManoObra === "" ||
      isNaN(precioManoObra) ||
      Number(precioManoObra) < 0
    )
      return "Ingrese un precio válido para mano de obra.";

    if (
      precioRepuestos === "" ||
      isNaN(precioRepuestos) ||
      Number(precioRepuestos) < 0
    )
      return "Ingrese un precio válido para repuestos.";

    return "";
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const errMsg = validar();
  if (errMsg) {
    setError(errMsg);
    return;
  }

  setSubmitting(true);
  try {
    const total = Number(precioManoObra) + Number(precioRepuestos);

    if (reparacion) {
      // Actualizar reparación existente
      const ref = doc(db, "reparaciones", reparacion.id);
      const datosActualizados = {
        descripcionReparacion: descripcion,
        vehiculoId,
        tallerId,
        patenteVehiculo,
        precioManoObra: Number(precioManoObra),
        precioRepuestos: Number(precioRepuestos),
        precioTotal: total,
        telefono,
        observaciones,
        modificadoEn: new Date(),
      };
      await updateDoc(ref, datosActualizados);

      // Llamar a onSuccess con el objeto actualizado incluyendo id
      onSuccess({ id: reparacion.id, ...datosActualizados });
    } else {
      // Crear nueva reparación
      const datosNuevos = {
        descripcionReparacion: descripcion,
        vehiculoId,
        tallerId,
        precioManoObra: Number(precioManoObra),
        precioRepuestos: Number(precioRepuestos),
        precioTotal: total,
        telefono,
        patenteVehiculo,
        observaciones,
        creadoEn: new Date(),
        saldo: total,
        estadoPago: "Pendiente",

      };

      const docRef = await addDoc(collection(db, "reparaciones"), datosNuevos);

      // Actualizar etiqueta del vehículo a "Reparación"
      const vehRef = doc(db, "vehiculos", vehiculoId);
      await updateDoc(vehRef, { etiqueta: "Reparación" });

      // Llamar a onSuccess con objeto que incluye el nuevo id
      onSuccess({ id: docRef.id, ...datosNuevos });
    }

    onClose();
  } catch (error) {
    setError("Error al guardar la reparación.");
  } finally {
    setSubmitting(false);
  }
};


  if (!visible) return null;


  const refrescarReparaciones = async () => {
  await fetchData();
};


  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-6 relative"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">
              {reparacion ? "Editar Reparación" : "Nueva Reparación"}
            </h2>

            {error && (
              <p className="mb-4 text-red-500 font-medium select-none">
                {error}
              </p>
            )}

            {loading ? (
              <Spinner text="Cargando datos..." />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-white">
                {/* Descripción */}
                <div>
                  <label
                    htmlFor="descripcion"
                    className="block text-sm font-medium mb-1"
                  >
                    Descripción
                  </label>
                  <input
                    id="descripcion"
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    placeholder="Descripción de la reparación"
                    required
                    autoFocus
                  />
                </div>

                {/* Vehículo */}
                <div>
                  <label
                    htmlFor="vehiculo"
                    className="block text-sm font-medium mb-1"
                  >
                    Vehículo
                  </label>
                  <select
                    id="vehiculo"
                    value={vehiculoId}
                    onChange={(e) => setVehiculoId(e.target.value)}
                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  >
                    <option value="">Seleccione un vehículo</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.patente} - {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Taller */}
                <div>
                  <label
                    htmlFor="taller"
                    className="block text-sm font-medium mb-1"
                  >
                    Taller
                  </label>
                  <select
                    id="taller"
                    value={tallerId}
                    onChange={(e) => setTallerId(e.target.value)}
                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  >
                    <option value="">Seleccione un taller</option>
                    {talleres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Precio Mano de Obra */}
                <div>
                  <label
                    htmlFor="precioManoObra"
                    className="block text-sm font-medium mb-1"
                  >
                    Precio Mano de Obra
                  </label>
                  <input
                    id="precioManoObra"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioManoObra}
                    onChange={(e) => setPrecioManoObra(e.target.value)}
                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    placeholder="Ingrese el precio de mano de obra"
                    required
                  />
                </div>

                {/* Precio Repuestos */}
                <div>
                  <label
                    htmlFor="precioRepuestos"
                    className="block text-sm font-medium mb-1"
                  >
                    Precio Repuestos
                  </label>
                  <input
                    id="precioRepuestos"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioRepuestos}
                    onChange={(e) => setPrecioRepuestos(e.target.value)}
                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    placeholder="Ingrese el precio de repuestos"
                    required
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label
                    htmlFor="telefono"
                    className="block text-sm font-medium mb-1"
                  >
                    Teléfono (WhatsApp)
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    placeholder="Ej: +5491123456789"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label
                    htmlFor="observaciones"
                    className="block text-sm font-medium mb-1"
                  >
                    Observaciones
                  </label>
                  <textarea
                    id="observaciones"
                    rows={3}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                    placeholder="Información adicional (opcional)"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold"
                  >
                    {submitting
                      ? "Guardando..."
                      : reparacion
                      ? "Guardar"
                      : "Crear"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
