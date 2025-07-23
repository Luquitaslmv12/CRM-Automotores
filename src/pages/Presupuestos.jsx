import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import BuscadorCliente from "../components/BuscadorCliente";
import BuscadorVehiculo from "../components/BuscadorVehiculo";
import ResumenCliente from "../components/ResumenCliente";
import ResumenVehiculo from "../components/ResumenVehiculo";
import ResumenVehiculoPartePago from "../components/ResumenVehiculoPartePago";
import { FileText, Plus, Trash, DollarSign, FileChartColumnIncreasing, } from "lucide-react";
import { NumericFormat } from "react-number-format";
import ModalVehiculoPartePago from "../components/ModalVehiculoPartePago";
import ListaPresupuestos from "../components/ListaPresupuestos";


export default function NuevoPresupuesto(props) {

  const [usuarios, setUsuarios] = useState([]);
  const [emitidoPor, setEmitidoPor] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const vehiculoSeleccionado = vehiculosDisponibles.find(
    (v) => v.id === vehiculoId
  );

  const [monto, setMonto] = useState("");
  const [pagos, setPagos] = useState([{ metodo: "", monto: "" }]);
  const [pagosMultiples, setPagosMultiples] = useState(false);

  const [parteDePago, setParteDePago] = useState(false);
  const [vehiculoPartePago, setVehiculoPartePago] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const user = auth.currentUser;

  const quitarCliente = () => {
    setClienteId("");
    setClienteSeleccionado(null);
  };

  const quitarVehiculo = () => {
    setVehiculoId("");
  };

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

  useEffect(() => {
    if (parteDePago) setModalOpen(true);
    else setModalOpen(false);
  }, [parteDePago]);

  useEffect(() => {
    if (!clienteId) return setClienteSeleccionado(null);

    const obtenerCliente = async () => {
      const ref = doc(db, "clientes", clienteId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setClienteSeleccionado({ id: snap.id, ...snap.data() });
      } else {
        setClienteSeleccionado(null);
      }
    };

    obtenerCliente();
  }, [clienteId]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vehiculos"), (snapshot) => {
      const disponibles = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((v) => v.estado === "Disponible");
      setVehiculosDisponibles(disponibles);
    });
    return () => unsub();
  }, []);

 const convertirPagosAFloat = (pagos) => {
  return pagos.map((pago) => {
    let montoString = "";

    if (typeof pago.monto === "string" || typeof pago.monto === "number") {
      montoString = String(pago.monto).trim();
    }

    const montoSinPuntos = montoString.replace(/\./g, "").replace(",", ".");
    const montoFloat = parseFloat(montoSinPuntos);

    return {
      ...pago,
      monto: isNaN(montoFloat) ? 0 : montoFloat,
    };
  });
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clienteSeleccionado) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!vehiculoId && !vehiculoPartePago) {
      toast.error("Selecciona un vehículo o ingresa uno en parte de pago");
      return;
    }

      if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
    toast.error("Ingresá un monto válido");
    return;
  }


    try {
      const presupuesto = {
        clienteId: clienteSeleccionado.id,
        vehiculoId: vehiculoId || null,
        monto: parseFloat(monto),
        pagos: pagosMultiples ? convertirPagosAFloat(pagos) : [],
        fecha: Timestamp.now(),
        creadoPor: user?.email || "Desconocido",
        emitidoPor,
        observaciones,
         asesor: emitidoPor,
  estado: "abierto",
  fechaCreacion: Timestamp.now(),
  fechaCierre: null,
        parteDePago: parteDePago ? vehiculoPartePago : null,
      };

      await addDoc(collection(db, "presupuestos"), presupuesto);
      toast.success("Presupuesto generado con éxito");

      setClienteId("");
      setVehiculoId("");
      setClienteSeleccionado(null);
      setVehiculoPartePago(null);
      setMonto("");
      setPagos([{ metodo: "", monto: "" }]);
      setPagosMultiples(false);
      setParteDePago(false);
    } catch (err) {
      console.error("Error generando presupuesto:", err);
      toast.error("Error generando presupuesto");
    }
  };

  const handlePagoChange = (index, campo, valor) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index][campo] = valor;
    setPagos(nuevosPagos);
  };

  return (
    <div className="p-6 pt-20 min-h-screen bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-800 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center flex justify-center items-center gap-2">
          <FileChartColumnIncreasing  className="w-10 h-10 text-lime-500 animate-bounce" />
          Presupuestos
        </h1>

      <motion.form
  onSubmit={handleSubmit}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
  className="bg-gradient-to-br from-slate-900 via-indigo-900/80 to-slate-900 backdrop-blur-lg p-8 rounded-3xl w-full shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] border-2 border-indigo-500/50 max-w-2xl mx-auto space-y-6"
>
  {/* Encabezado */}
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.1 }}
    className="flex items-center gap-3 mb-6"
  >
    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
      <FileText size={24} className="text-indigo-400" />
    </div>
    <div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
        Generar Presupuesto
      </h2>
      <p className="text-sm text-slate-400">Complete los detalles del presupuesto</p>
    </div>
  </motion.div>

  {/* Campo Emitido por */}
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-300">Emitido por</label>
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
      <select
        value={emitidoPor}
        onChange={(e) => setEmitidoPor(e.target.value)}
        className="w-full p-3 rounded-lg bg-slate-800/60 text-slate-200 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
        required
      >
        <option value="" disabled className="text-slate-500">
          Seleccione un usuario
        </option>
        {usuarios.map((usuario) => (
          <option 
            key={usuario.id} 
            value={usuario.email}
            className="bg-slate-600 text-slate-200"
          >
            {usuario.nombre} ({usuario.email})
          </option>
        ))}
      </select>
    </motion.div>
  </div>

  {/* Grid Cliente y Vehículo */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-1 "
    >
      <label className="text-sm font-medium text-slate-300">Cliente</label>
      <BuscadorCliente
        placeholder="Buscar Cliente..."
        value={clienteSeleccionado}
        onChange={setClienteSeleccionado}
      />
    </motion.div>

    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-1"
    >
      <label className="text-sm font-medium text-slate-300">Vehículo</label>
      <BuscadorVehiculo
        value={vehiculoId}
        onChange={setVehiculoId}
        vehiculos={vehiculosDisponibles}
      />
    </motion.div>
  </div>

  {/* Checkbox Parte de Pago */}
  <motion.div 
    whileHover={{ scale: 1.01 }}
    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-indigo-500/30 transition-colors"
  >
    <div className="flex items-center">
      <input
        type="checkbox"
        id="parteDePago"
        checked={parteDePago}
        onChange={() => setParteDePago(!parteDePago)}
        className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
      />
    </div>
    <label htmlFor="parteDePago" className="text-slate-300">
      Cliente entrega vehículo en parte de pago
    </label>
  </motion.div>

  {/* Pagos Múltiples */}
  <div className="space-y-3">
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-indigo-500/30 transition-colors"
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          id="pagosMultiples"
          checked={pagosMultiples}
          onChange={() => setPagosMultiples(!pagosMultiples)}
          className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <label htmlFor="pagosMultiples" className="text-slate-300">
        Usar múltiples métodos de pago
      </label>
    </motion.div>

    {pagosMultiples && (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3 }}
        className="space-y-3 pl-4 border-l-2 border-indigo-500/20 ml-3"
      >
        {pagos.map((pago, i) => (
          <motion.div 
            key={i}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2 items-center"
          >
            <input
              placeholder="Método (ej: Transferencia)"
              className="flex-1 p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              value={pago.metodo}
              onChange={(e) => handlePagoChange(i, "metodo", e.target.value)}
            />
            <NumericFormat
  value={pago.monto}
  onValueChange={(values) => {
    // values.value contiene el valor sin formato (ej: "1500000")
    // values.formattedValue contiene el valor formateado (ej: "1.500.000,00")
    handlePagoChange(i, "monto", values.floatValue) // Guarda el valor numérico
  }}
  thousandSeparator="."
  decimalSeparator=","
  decimalScale={2}
  fixedDecimalScale={true}
  allowNegative={false}
  placeholder="0,00"
  className="w-32 p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
  // Agrega prefix si quieres el símbolo $ antes del valor
  prefix="$ "
/>
            <button
              type="button"
              onClick={() => setPagos(pagos.filter((_, idx) => idx !== i))}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800/50"
              aria-label="Eliminar pago"
            >
              <Trash size={18} />
            </button>
          </motion.div>
        ))}
        <motion.button
          type="button"
          onClick={() => setPagos([...pagos, { metodo: "", monto: "" }])}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Plus size={16} /> Agregar método de pago
        </motion.button>
      </motion.div>
    )}
  </div>

  {/* Monto */}
  {vehiculoId && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-1"
    >
      <label className="text-sm font-medium text-slate-300">Monto</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
          <DollarSign size={18} />
        </div>
        <NumericFormat
          value={monto}
          onValueChange={({ floatValue }) => setMonto(floatValue)}
          thousandSeparator="."
          decimalSeparator=","
          className="w-full pl-10 p-3 rounded-lg bg-slate-800/60 text-slate-200 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
          placeholder="Valor del vehículo"
        />
      </div>
    </motion.div>
  )}

  <motion.div 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.35 }}
  className="space-y-1"
>
  <label className="text-sm font-medium text-slate-300">Observaciones</label>
  <textarea
    value={observaciones}
    onChange={(e) => setObservaciones(e.target.value)}
    placeholder="Observaciones generales del presupuesto..."
    className="w-full p-3 h-24 resize-none rounded-lg bg-slate-800/60 text-slate-200 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
  />
</motion.div>

  {/* Botón Submit */}
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="pt-4"
  >
    <button
      type="submit"
      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <FileText size={18} className="inline" />
      <span>Generar presupuesto</span>
    </button>
  </motion.div>
</motion.form>

      {modalOpen && clienteSeleccionado && (
        <ModalVehiculoPartePago
          vehiculo={vehiculoPartePago} // ← esta es la clave
          onClose={() => setModalOpen(false)}
          onSave={(datosVehiculo) => {
            setVehiculoPartePago(datosVehiculo);
            setModalOpen(false);
          }}
        />
      )}

       <div className="max-w-screen-xl mx-auto">
          <div className="grid gap-4 mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ">
        <ResumenCliente
          cliente={clienteSeleccionado}
          onRemove={quitarCliente}
        />
        <ResumenVehiculo
          vehiculo={vehiculoSeleccionado}
          onRemove={quitarVehiculo}
        />
        {vehiculoPartePago && (
          <ResumenVehiculoPartePago
            vehiculo={vehiculoPartePago}
            onRemove={() => setVehiculoPartePago(null)}
            onClick={() => setModalOpen(true)}
          />
        )}
      </div>
      </div>
      <ListaPresupuestos />
    </div>
  );
}
