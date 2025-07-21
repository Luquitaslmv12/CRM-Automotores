import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase";
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from "firebase/firestore";
import { X, Car, Wrench, Calendar, ClipboardList, DollarSign, AlertCircle,CheckCircle2  } from "lucide-react";
import { NumericFormat } from "react-number-format";
import toast from "react-hot-toast";
import Spinner from "../Spinner/Spinner";

export default function ModalNuevaReparacion({
  visible,
  onClose,
  onSuccess,
  reparacion,
}) {
  const [formData, setFormData] = useState({
    descripcion: "",
    vehiculoId: reparacion?.vehiculoId || "",
    tallerId: "",
    precioManoObra: "",
    precioRepuestos: "",
    telefono: "",
    observaciones: "",
    fechaReparacion: "",
  });

  const [vehiculos, setVehiculos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === formData.vehiculoId);
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
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Error al cargar datos");
        setVehiculos([]);
        setTalleres([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [visible, reparacion?.vehiculoId]);

  useEffect(() => {
    if (reparacion) {
      setFormData({
        descripcion: reparacion.descripcionReparacion || "",
        vehiculoId: reparacion.vehiculoId || "",
        tallerId: reparacion.tallerId || "",
        precioManoObra: reparacion.precioManoObra || "",
        precioRepuestos: reparacion.precioRepuestos || "",
        telefono: reparacion.telefono || "",
        observaciones: reparacion.observaciones || "",
        fechaReparacion: reparacion?.fecha
          ? new Date(reparacion.fecha.seconds * 1000).toISOString().split("T")[0]
          : "",
      });
    } else {
      setFormData({
        descripcion: "",
        vehiculoId: "",
        tallerId: "",
        precioManoObra: "",
        precioRepuestos: "",
        telefono: "",
        observaciones: "",
        fechaReparacion: new Date().toISOString().split("T")[0],
      });
    }
    setError("");
  }, [reparacion, visible]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validar = () => {
    if (!formData.descripcion.trim()) return "La descripción es obligatoria.";
    if (!formData.vehiculoId) return "Debe seleccionar un vehículo.";
    if (!formData.tallerId) return "Debe seleccionar un taller.";

    if (
      formData.precioManoObra === "" ||
      isNaN(formData.precioManoObra) ||
      Number(formData.precioManoObra) < 0
    )
      return "Ingrese un precio válido para mano de obra.";

    if (
      formData.precioRepuestos === "" ||
      isNaN(formData.precioRepuestos) ||
      Number(formData.precioRepuestos) < 0
    )
      return "Ingrese un precio válido para repuestos.";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errMsg = validar();
    if (errMsg) {
      setError(errMsg);
      toast.error(errMsg);
      return;
    }

    setSubmitting(true);
    try {
      const total = Number(formData.precioManoObra) + Number(formData.precioRepuestos);

      if (reparacion) {
        // Actualizar reparación existente
        const ref = doc(db, "reparaciones", reparacion.id);
        const datosActualizados = {
          fecha: new Date(formData.fechaReparacion),
          descripcionReparacion: formData.descripcion,
          vehiculoId: formData.vehiculoId,
          tallerId: formData.tallerId,
          patenteVehiculo,
          precioManoObra: Number(formData.precioManoObra),
          precioRepuestos: Number(formData.precioRepuestos),
          precioTotal: total,
          telefono: formData.telefono,
          observaciones: formData.observaciones,
          modificadoEn: new Date(),
        };
        await updateDoc(ref, datosActualizados);
        toast.success("Reparación actualizada correctamente");
        onSuccess({ id: reparacion.id, ...datosActualizados });
      } else {
        // Crear nueva reparación
        const datosNuevos = {
          fecha: new Date(formData.fechaReparacion),
          descripcionReparacion: formData.descripcion,
          vehiculoId: formData.vehiculoId,
          tallerId: formData.tallerId,
          precioManoObra: Number(formData.precioManoObra),
          precioRepuestos: Number(formData.precioRepuestos),
          precioTotal: total,
          telefono: formData.telefono,
          patenteVehiculo,
          observaciones: formData.observaciones,
          creadoEn: new Date(),
          saldo: total,
          estadoPago: "Pendiente",
        };

        const docRef = await addDoc(collection(db, "reparaciones"), datosNuevos);
        
        // Actualizar etiqueta del vehículo
        const vehRef = doc(db, "vehiculos", formData.vehiculoId);
        await updateDoc(vehRef, { etiqueta: "Reparación" });

        toast.success("Reparación creada correctamente");
        onSuccess({ id: docRef.id, ...datosNuevos });
      }

      onClose();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al guardar la reparación.");
      toast.error("Error al guardar la reparación");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6 relative border border-slate-700"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-900/50 rounded-lg">
                <Wrench className="text-indigo-400 w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {reparacion ? "Editar Reparación" : "Nueva Reparación"}
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/20 rounded-md flex items-start gap-2 text-red-400 border border-red-800/50">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <Spinner text="Cargando datos..." />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Descripción */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-300 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Descripción de la reparación
                    </label>
                    <input
                      name="descripcion"
                      type="text"
                      value={formData.descripcion}
                      onChange={handleChange}
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Ej: Cambio de aceite y filtro"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Fecha de Reparación */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fecha de Reparación
                    </label>
                    <input
                      name="fechaReparacion"
                      type="date"
                      value={formData.fechaReparacion}
                      onChange={handleChange}
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      Teléfono de contacto
                    </label>
                    <input
                      name="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Ej: 11 1234-5678"
                    />
                  </div>

                  {/* Vehículo */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Vehículo
                    </label>
                    <select
                      name="vehiculoId"
                      value={formData.vehiculoId}
                      onChange={handleChange}
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none"
                      required
                    >
                      <option value="">Seleccione un vehículo</option>
                      {vehiculos.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.patente} - {v.marca} {v.modelo} {v.anio}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Taller */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Taller
                    </label>
                    <select
                      name="tallerId"
                      value={formData.tallerId}
                      onChange={handleChange}
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none"
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
                    <label className="block text-sm font-medium mb-1 text-slate-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Mano de obra
                    </label>
                    <NumericFormat
                      name="precioManoObra"
                      value={formData.precioManoObra}
                      onValueChange={(values) => handleNumericChange("precioManoObra", values.floatValue || "")}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale
                      prefix="$ "
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="$ 0,00"
                      required
                    />
                  </div>

                  {/* Precio Repuestos */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Repuestos
                    </label>
                    <NumericFormat
                      name="precioRepuestos"
                      value={formData.precioRepuestos}
                      onValueChange={(values) => handleNumericChange("precioRepuestos", values.floatValue || "")}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale
                      prefix="$ "
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="$ 0,00"
                      required
                    />
                  </div>

                  {/* Total */}
                  <div className="md:col-span-2 bg-slate-800/50 p-3 rounded-md border border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-300">Total estimado:</span>
                      <span className="text-xl font-bold text-white">
                        ${" "}
                        {(
                          Number(formData.precioManoObra || 0) + 
                          Number(formData.precioRepuestos || 0)
                        ).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      rows={3}
                      value={formData.observaciones}
                      onChange={handleChange}
                      className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                      placeholder="Detalles adicionales sobre la reparación..."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 transition text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {reparacion ? "Guardando..." : "Creando..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {reparacion ? "Guardar cambios" : "Crear reparación"}
                      </>
                    )}
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