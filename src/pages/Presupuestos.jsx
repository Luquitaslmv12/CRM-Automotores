import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from 'react-hot-toast';
import {
  FileText,
  DollarSign,
  Plus,
  Trash,
} from "lucide-react";
import { NumericFormat } from 'react-number-format';
import ListaPresupuestos from "../components/ListaPresupuestos";

export default function NuevoPresupuesto() {
  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const [vehiculoBusqueda, setVehiculoBusqueda] = useState("");
  const [vehiculosFiltrados, setVehiculosFiltrados] = useState([]);
  const [vehiculoId, setVehiculoId] = useState("");
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

  const [monto, setMonto] = useState("");
  const [pagosMultiples, setPagosMultiples] = useState(false);
  const [pagos, setPagos] = useState([{ metodo: "", monto: "" }]);

  const [vigencia, setVigencia] = useState(""); // En días
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [loadingVehiculo, setLoadingVehiculo] = useState(false);
  const [errores, setErrores] = useState({});

  const skipBusquedaVehiculoRef = useRef(false);
  const skipBusquedaClienteRef = useRef(false);

  const convertirPagosAFloat = (pagos) => {
    return pagos.map((pago) => {
      const montoSinPuntos = pago.monto.replace(/\./g, '').replace(',', '.');
      const montoFloat = parseFloat(montoSinPuntos);
      return { ...pago, monto: isNaN(montoFloat) ? 0 : montoFloat };
    });
  };

  const onSelectCliente = (cliente) => {
    setClienteId(cliente.id);
    setClienteBusqueda(cliente.nombre);
    setClientesFiltrados([]);
    setClienteSeleccionado(cliente);
    setErrores((prev) => ({ ...prev, clienteId: false }));
    skipBusquedaClienteRef.current = true;
  };

  const onSelectVehiculo = (vehiculo) => {
    setVehiculoId(vehiculo.id);
    setVehiculoBusqueda(`${vehiculo.marca} ${vehiculo.modelo}`);
    setVehiculosFiltrados([]);
    setVehiculoSeleccionado(vehiculo);
    setErrores((prev) => ({ ...prev, vehiculoId: false }));
    skipBusquedaVehiculoRef.current = true;
  };

  useEffect(() => {
    if (skipBusquedaClienteRef.current) {
      skipBusquedaClienteRef.current = false;
      return;
    }
    const fetchClientes = async () => {
      if (clienteBusqueda.trim() === "") return setClientesFiltrados([]);
      setLoadingCliente(true);
      const snap = await getDocs(collection(db, "clientes"));
      const clientes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filtrados = clientes.filter((c) =>
        c.nombre.toLowerCase().includes(clienteBusqueda.toLowerCase())
      );
      setClientesFiltrados(filtrados);
      setLoadingCliente(false);
    };
    const timeout = setTimeout(fetchClientes, 300);
    return () => clearTimeout(timeout);
  }, [clienteBusqueda]);

  useEffect(() => {
    if (skipBusquedaVehiculoRef.current) {
      skipBusquedaVehiculoRef.current = false;
      return;
    }
    const fetchVehiculos = async () => {
      if (vehiculoBusqueda.trim() === "") return setVehiculosFiltrados([]);
      setLoadingVehiculo(true);
      const snap = await getDocs(collection(db, "vehiculos"));
      const vehiculos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const disponibles = vehiculos.filter(
        (v) =>
          v.estado === "Disponible" &&
          `${v.marca} ${v.modelo}`.toLowerCase().includes(vehiculoBusqueda.toLowerCase())
      );
      setVehiculosFiltrados(disponibles);
      setLoadingVehiculo(false);
    };
    const timeout = setTimeout(fetchVehiculos, 300);
    return () => clearTimeout(timeout);
  }, [vehiculoBusqueda]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pagosProcesados = convertirPagosAFloat(pagos);
    const nuevosErrores = {};
    if (!clienteId) nuevosErrores.clienteId = true;
    if (!vehiculoId) nuevosErrores.vehiculoId = true;
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      toast.error("Faltan campos requeridos.");
      return;
    }

    try {
      await addDoc(collection(db, "presupuestos"), {
        clienteId,
        vehiculoId,
        monto: monto ? parseFloat(monto.replace(/\./g, "").replace(",", ".")) : null,
        pagos: pagosMultiples ? pagosProcesados : [],
        vigencia: vigencia ? parseInt(vigencia) : null,
        fecha: Timestamp.now(),
      });

      toast.success("Presupuesto guardado.");
      // Reset
      setClienteId("");
      setVehiculoId("");
      setClienteBusqueda("");
      setVehiculoBusqueda("");
      setMonto("");
      setClienteSeleccionado(null);
      setVehiculoSeleccionado(null);
      setPagos([{ metodo: "", monto: "" }]);
      setPagosMultiples(false);
      setVigencia("");
      setErrores({});
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el presupuesto.");
    }
  };

  const handlePagoChange = (index, campo, valor) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index][campo] = valor;
    setPagos(nuevosPagos);
  };

  const agregarPago = () => setPagos([...pagos, { metodo: "", monto: "" }]);
  const quitarPago = (index) => setPagos(pagos.filter((_, i) => i !== index));

  return (
    <>
      <Toaster position="top-right" />
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 max-w-md mx-auto bg-slate-900 rounded-xl shadow space-y-6 text-white relative"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText size={28} className="text-yellow-400" />
          <h2 className="text-xl font-semibold">Nuevo Presupuesto</h2>
        </div>

        {/* Cliente y Vehículo (igual que antes) */}
        {/* ... reutilizá lo mismo que tu componente de venta ... */}

        {/* Monto estimado */}
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
          <NumericFormat
            value={monto}
            onValueChange={({ formattedValue }) => setMonto(formattedValue)}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            placeholder="Monto estimado (opcional)"
            className="w-full pl-10 p-2 rounded bg-slate-700 text-white"
          />
        </div>

        {/* Vigencia en días */}
        <input
          type="number"
          placeholder="Vigencia en días (opcional)"
          value={vigencia}
          onChange={(e) => setVigencia(e.target.value)}
          className="w-full p-2 rounded bg-slate-700 text-white"
        />

        {/* Métodos de pago estimados (igual que antes) */}
        {pagosMultiples && pagos.map((pago, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Método"
              value={pago.metodo}
              onChange={(e) => handlePagoChange(index, "metodo", e.target.value)}
              className="flex-1 p-2 rounded bg-slate-700 text-white"
            />
            <NumericFormat
              value={pago.monto}
              onValueChange={({ formattedValue }) =>
                handlePagoChange(index, "monto", formattedValue)
              }
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              placeholder="Monto"
              className="w-28 p-2 rounded bg-slate-700 text-white"
            />
            <button
              type="button"
              onClick={() => quitarPago(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash size={18} />
            </button>
          </div>
        ))}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pagosMultiples}
            onChange={() => setPagosMultiples(!pagosMultiples)}
          />
          Estimar múltiples métodos de pago
        </label>
        {pagosMultiples && (
          <button
            type="button"
            onClick={agregarPago}
            className="flex items-center text-sm text-blue-400 hover:underline"
          >
            <Plus size={18} className="mr-1" /> Agregar otro método
          </button>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700"
        >
          <FileText size={24} /> Guardar presupuesto
        </button>
      </motion.form>
      <ListaPresupuestos />
    </>
  );
}