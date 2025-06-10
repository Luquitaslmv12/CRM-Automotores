import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from 'react-hot-toast';
import {
  BadgeDollarSign,
  ShoppingCart,
  X,
  Search,
  Car,
  DollarSign,
  Plus,
  Trash,
  LoaderCircle
} from "lucide-react";
import { NumericFormat } from 'react-number-format';

export default function NuevaVenta() {
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

  const [loadingCliente, setLoadingCliente] = useState(false);
  const [loadingVehiculo, setLoadingVehiculo] = useState(false);
  const [errores, setErrores] = useState({});

const skipBusquedaVehiculoRef = useRef(false);
const skipBusquedaClienteRef = useRef(false);

  const convertirPagosAFloat = (pagos) => {
  return pagos.map((pago) => {
    const montoSinPuntos = pago.monto.replace(/\./g, '').replace(',', '.');
    const montoFloat = parseFloat(montoSinPuntos);

    return {
      ...pago,
      monto: isNaN(montoFloat) ? 0 : montoFloat,
    };
  });
};


 const onSelectCliente = (cliente) => {
  setClienteId(cliente.id);
  setClienteBusqueda(cliente.nombre);
  setClientesFiltrados([]);
  setClienteSeleccionado(cliente);
  setErrores((prev) => ({ ...prev, clienteId: false }));
  skipBusquedaClienteRef.current = true; // ✅ evita refiltro automático
};

const onSelectVehiculo = (vehiculo) => {
  setVehiculoId(vehiculo.id);
  setVehiculoBusqueda(`${vehiculo.marca} ${vehiculo.modelo}`);
  setVehiculosFiltrados([]);
  setVehiculoSeleccionado(vehiculo);
  setErrores((prev) => ({ ...prev, vehiculoId: false }));
  skipBusquedaVehiculoRef.current = true; // ✅ evita que dispare búsqueda innecesaria
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



  const quitarCliente = () => {
    setClienteSeleccionado(null);
    setTimeout(() => {
      setClienteId("");
      setClienteBusqueda("");
    }, 300);
  };

  const quitarVehiculo = () => {
    setVehiculoSeleccionado(null);
    setTimeout(() => {
      setVehiculoId("");
      setVehiculoBusqueda("");
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pagosProcesados = convertirPagosAFloat(pagos);
    const nuevosErrores = {};
    if (!clienteId) nuevosErrores.clienteId = true;
    if (!vehiculoId) nuevosErrores.vehiculoId = true;
    if (!monto) nuevosErrores.monto = true;
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    try {
      await addDoc(collection(db, "ventas"), {
        clienteId,
        vehiculoId,
        monto: parseFloat(monto),
        pagos: pagosMultiples ? pagosProcesados : [],
        fecha: Timestamp.now(),
      });

      await updateDoc(doc(db, "vehiculos", vehiculoId), {
        estado: "Vendido",
      });

      toast.success("¡Venta registrada con éxito!");
      setClienteId("");
      setVehiculoId("");
      setClienteBusqueda("");
      setVehiculoBusqueda("");
      setMonto("");
      setClienteSeleccionado(null);
      setVehiculoSeleccionado(null);
      setPagos([{ metodo: "", monto: "" }]);
      setPagosMultiples(false);
      setErrores({});
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar la venta.");
    }
  };

  const handlePagoChange = (index, campo, valor) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index][campo] = valor;
    setPagos(nuevosPagos);
  };

  const agregarPago = () => {
    setPagos([...pagos, { metodo: "", monto: "" }]);
  };

  const quitarPago = (index) => {
    const nuevosPagos = pagos.filter((_, i) => i !== index);
    setPagos(nuevosPagos);
  };

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
        <ShoppingCart size={28} className="text-green-400" />
        <h2 className="text-xl font-semibold">Registrar Nueva Venta</h2>
      </div>

      {/* Cliente */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre"
          value={clienteBusqueda}
          onChange={(e) => setClienteBusqueda(e.target.value)}
          className={`w-full pl-10 p-2 rounded bg-slate-700 text-white ${
            errores.clienteId ? "border-2 border-red-500" : ""
          }`}
        />
        {loadingCliente && (
  <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400">
    <LoaderCircle className="w-4 h-4" />
  </div>
)}
        {clientesFiltrados.length > 0 && (
          <div className=" rounded shadow max-h-40 overflow-y-auto mt-1 z-10 bg-slate-700 text-white">
            {clientesFiltrados.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCliente(c)}
                className="p-2 hover:bg-slate-800 cursor-pointer border-b"
              >
                {c.nombre} · {c.email}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehículo */}
      <div className="relative">
        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar vehículo por marca o modelo"
          value={vehiculoBusqueda}
          onChange={(e) => setVehiculoBusqueda(e.target.value)}
          className={`w-full pl-10 p-2 rounded bg-slate-700 text-white ${
            errores.vehiculoId ? "border-2 border-red-500" : ""
          }`}
        />
        {loadingVehiculo && (
  <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400">
    <LoaderCircle className="w-4 h-4" />
  </div>
)}
        {vehiculosFiltrados.length > 0 && (
          <div className="rounded shadow max-h-40 overflow-y-auto mt-1 z-10 bg-slate-700 text-white">
            {vehiculosFiltrados.map((v) => (
              <div
                key={v.id}
                onClick={() => onSelectVehiculo(v)}
                className="p-2 hover:bg-slate-800 cursor-pointer border-b"
              >
                {v.marca} {v.modelo} · Patente: {v.patente}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monto total */}
      <div className="relative">
  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
  <NumericFormat
    value={monto}
    onValueChange={({ formattedValue, floatValue }) => {
      setMonto(formattedValue);
      setErrores((prev) => ({ ...prev, monto: false }));
    }}
    thousandSeparator="."
    decimalSeparator=","
    decimalScale={2}
    fixedDecimalScale
    allowNegative={false}
    placeholder="Monto total de la venta"
    className={`w-full pl-10 p-2 rounded bg-slate-700 text-white ${
      errores.monto ? "border-2 border-red-500" : ""
    }`}
  />
</div>

      {/* Múltiples métodos de pago */}
      <label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={pagosMultiples}
    onChange={() => setPagosMultiples(!pagosMultiples)}
  />
  Usar múltiples métodos de pago
</label>

{pagosMultiples && (
  <div className="space-y-3">
    {pagos.map((pago, index) => (
      <div key={index} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Método (efectivo, dólares, etc)"
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
    <button
      type="button"
      onClick={agregarPago}
      className="flex items-center text-sm text-blue-400 hover:underline"
    >
      <Plus size={18} className="mr-1" /> Agregar otro método
    </button>
  </div>
)}
      {/* Resumen visual */}
      <div className="flex gap-4 mt-4 text-black">
        <AnimatePresence>
          {clienteSeleccionado && (
            <motion.div
              key="cliente"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded p-4 shadow flex-1 relative"
            >
              <button
                type="button"
                onClick={quitarCliente}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                <X />
              </button>
              <h3 className="font-bold text-lg mb-2">Cliente seleccionado</h3>
              <p>{clienteSeleccionado.nombre}</p>
              <p className="text-sm text-gray-700">{clienteSeleccionado.email}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {vehiculoSeleccionado && (
            <motion.div
              key="vehiculo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded p-4 shadow flex-1 relative"
            >
              <button
                type="button"
                onClick={quitarVehiculo}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                <X />
              </button>
              <h3 className="font-bold text-lg mb-2">Vehículo seleccionado</h3>
              <p>
                {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
              </p>
              <p className="text-sm text-gray-700">Patente: {vehiculoSeleccionado.patente}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg transition flex-1 bg-indigo-700 hover:bg-indigo-800"
      >
        <BadgeDollarSign size={28} /> Registrar venta
      </button>
    </motion.form>
    </>
  );
}
