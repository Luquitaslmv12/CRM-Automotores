import { useEffect, useState } from "react";
import { db, auth} from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import BuscadorCliente from "../components/BuscadorCliente";
import BuscadorVehiculo from "../components/BuscadorVehiculo";
import ResumenCliente from '../components/ResumenCliente';
import ResumenVehiculo from '../components/ResumenVehiculo';
import {
  BadgeDollarSign,
  ShoppingCart,
  X,
  Trash,
  Plus,
  DollarSign,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import Listaventas from "../components/ListaVentas";
import ModalVehiculoPartePago from "../components/ModalVehiculoPartePago";

export default function NuevaVenta() {
  const [clienteId, setClienteId] = useState("");
const [vehiculoId, setVehiculoId] = useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

  const [monto, setMonto] = useState("");
  const [pagosMultiples, setPagosMultiples] = useState(false);
  const [pagos, setPagos] = useState([{ metodo: "", monto: "" }]);
  const [errores, setErrores] = useState({});

  const [fechaVenta, setFechaVenta] = useState(() => {
  const hoy = new Date();
  return hoy.toISOString().split("T")[0]; // formato YYYY-MM-DD
});

const [parteDePago, setParteDePago] = useState(false);
const [modalOpen, setModalOpen] = useState(false);

const [vehiculoPartePagoId, setVehiculoPartePagoId] = useState(null);
const [vehiculoPartePago, setVehiculoPartePago] = useState(null);
const user = auth.currentUser;


const agregarVehiculoAlStock = async (vehiculo) => {
  try {
    const nuevoVehiculo = {
      marca: vehiculo.marca?.trim() || "",
      modelo: vehiculo.modelo?.trim() || "",
      año: parseInt(vehiculo.año) || null,
      precioCompra: Number(vehiculo.precioCompra) || 0,
      patente: vehiculo.patente?.trim().toUpperCase() || "",
      estado: vehiculo.estado || "Disponible",
      clienteNombre: vehiculo.clienteNombre || "",
      clienteApellido: vehiculo.clienteApellido || "",
      creadoPor: user?.email || "Desconocido",
      creadoEn: new Date(),
      fechaIngreso: new Date(),
      // ...otros campos que tengas en vehiculoPartePago
    };

    const docRef = await addDoc(collection(db, "vehiculos"), nuevoVehiculo);
    console.log("Vehículo agregado a Vehiculos con ID:", docRef.id);
  } catch (error) {
    console.error("Error al agregar el vehículo al stock:", error);
  }
};


useEffect(() => {
  if (parteDePago) setModalOpen(true);
  else setModalOpen(false);
}, [parteDePago]);



  // Obtener info del cliente seleccionado
  useEffect(() => {
    if (!clienteId) return setClienteSeleccionado(null);
    const obtenerCliente = async () => {
      const snap = await getDocs(collection(db, "clientes"));
      const cliente = snap.docs.find((doc) => doc.id === clienteId);
      if (cliente) setClienteSeleccionado({ id: cliente.id, ...cliente.data() });
    };
    obtenerCliente();
  }, [clienteId]);

  // Obtener info del vehículo seleccionado
  useEffect(() => {
    if (!vehiculoId) return setVehiculoSeleccionado(null);
    const obtenerVehiculo = async () => {
      const snap = await getDocs(collection(db, "vehiculos"));
      const vehiculo = snap.docs.find((doc) => doc.id === vehiculoId);
      if (vehiculo) setVehiculoSeleccionado({ id: vehiculo.id, ...vehiculo.data() });
    };
    obtenerVehiculo();
  }, [vehiculoId]);

  const quitarCliente = () => {
    setClienteId("");
    setClienteSeleccionado(null);
  };

  const quitarVehiculo = () => {
    setVehiculoId("");
    setVehiculoSeleccionado(null);
  };

  const convertirPagosAFloat = (pagos) => {
    return pagos.map((pago) => {
      const montoSinPuntos = pago.monto.replace(/\./g, "").replace(",", ".");
      const montoFloat = parseFloat(montoSinPuntos);
      return {
        ...pago,
        monto: isNaN(montoFloat) ? 0 : montoFloat,
      };
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  const pagosProcesados = convertirPagosAFloat(pagos);
  const nuevosErrores = {};

  // Validaciones
  if (!clienteSeleccionado) {
    toast.error("Selecciona un cliente");
    return;
  }
  if (!vehiculoId) nuevosErrores.vehiculoId = true;
  if (!monto) nuevosErrores.monto = true;
  if (parteDePago && !vehiculoPartePago) {
    toast.error("Debes completar los datos del vehículo entregado en parte de pago.");
    return;
  }

  setErrores(nuevosErrores);

  if (Object.keys(nuevosErrores).length > 0) {
    toast.error("Por favor completa todos los campos.");
    return;
  }

  try {
    // 1. Crear la venta (inicialmente sin vehiculoPartePagoId)
    const ventaRef = await addDoc(collection(db, "ventas"), {
      clienteId: clienteSeleccionado.id,
      vehiculoId,
      monto: parseFloat(monto),
      pagos: pagosMultiples ? pagosProcesados : [],
      fecha: Timestamp.fromDate(new Date(fechaVenta)),
      creadoPor: user?.email || "Desconocido",
      creadoEn: new Date(),
    });

    // 2. Si hay vehículo en parte de pago, guardarlo por separado
    if (parteDePago && vehiculoPartePago) {
      const vehiculoRef = await addDoc(collection(db, "vehiculosPartePago"), {
        ...vehiculoPartePago,
        clienteId: clienteSeleccionado.id,
        clienteNombre: clienteSeleccionado.nombre,
        clienteApellido: clienteSeleccionado.apellido,
        ventaId: ventaRef.id,
        fechaEntrega: new Date(),
        creadoPor: user?.email || "Desconocido",
        creadoEn: new Date(),
      });

      const vehiculoParaGuardar = {
  marca: vehiculoPartePago.marca?.trim() || "No especificado",
  modelo: vehiculoPartePago.modelo?.trim() || "No especificado",
  tipo: vehiculoPartePago.tipo?.trim() || "No especificado",
  patente: vehiculoPartePago.patente.trim() || "No especificado",
  año: parseInt(vehiculoPartePago.año) || null,
  color: vehiculoPartePago.color || "",
  etiqueta: "Usado",
  vendidoPor: user?.email || "",
  vendidoEn: new Date(),
  monto: parseFloat(vehiculoPartePago.monto) || 0,
  clienteNombre: clienteSeleccionado?.nombre || "",
  clienteApellido: clienteSeleccionado?.apellido || "",
  precioCompra: parseFloat(monto) || 0,
  creadoPor: user?.email || "Desconocido",
  creadoEn: new Date(),
};

await agregarVehiculoAlStock(vehiculoParaGuardar);
  
      console.log("Vehículo parte de pago creado con ID:", vehiculoRef.id);

      // 3. Actualizar la venta con el ID del vehículo entregado
      await updateDoc(doc(db, "ventas", ventaRef.id), {
        vehiculoPartePagoId: vehiculoRef.id,
      });
    }

    // 4. Marcar el vehículo vendido
    await updateDoc(doc(db, "vehiculos", vehiculoId), {
      estado: "Vendido",
      clienteId: clienteSeleccionado.id,
      clienteNombre: clienteSeleccionado.nombre,
      clienteApellido: clienteSeleccionado.apellido,
      etiqueta: "Vendido",
      vendidoPor: user?.email || "",
  vendidoEn: new Date(),
      modificadoPor: user?.email || "Desconocido",
  modificadoEn: new Date(),
    });

    toast.success("¡Venta registrada con éxito!");

    // 5. Resetear formulario
    setClienteId("");
    setVehiculoId("");
    setMonto("");
    setClienteSeleccionado(null);
    setVehiculoSeleccionado(null);
    setPagos([{ metodo: "", monto: "" }]);
    setPagosMultiples(false);
    setErrores({});
    setParteDePago(false);
    setVehiculoPartePago(null);

  } catch (error) {
    console.error("Error al registrar la venta:", error);
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
    setPagos(pagos.filter((_, i) => i !== index));
  };

  return (
    <>
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">Ventas</h1>


      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-slate-800 p-6 rounded-2xl shadow-xl w-xl max-w-3xl mx-auto mb-8"
      >
        
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={28} className="text-green-400" />
          <h2 className="text-xl font-semibold">Registrar Nueva Venta</h2>
        </div>

        <div className="mb-4">
  <label className="block mb-1 text-sm font-medium text-white">
  </label>
  <input
    type="date"
    value={fechaVenta}
    onChange={(e) => setFechaVenta(e.target.value)}
    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
</div>

        {/* Cliente */}
        <div className="relative">
          <div className="relative">
  <BuscadorCliente
    value={clienteSeleccionado}
    onChange={setClienteSeleccionado}
  />
</div>
        </div>

        {/* Vehículo */}
        <div className="relative ">
          <BuscadorVehiculo value={vehiculoId} onChange={setVehiculoId}  />
            
        </div>

        {/* Vehículo parte de pago */}
        <label className="flex items-center gap-2 p-4 text-white">
  <input
    type="checkbox"
    checked={parteDePago}
    onChange={() => setParteDePago(!parteDePago)}
  />
  Cliente entrega vehículo en parte de pago
</label>

        {/* Monto total */}
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
          <NumericFormat
            value={monto}
            onValueChange={({ floatValue }) => {
              setMonto(floatValue);
              setErrores((prev) => ({ ...prev, monto: false }));
            }}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            placeholder="Monto total de la venta"
            className={`w-full pl-10 p-3 rounded bg-slate-700 text-white ${
              errores.monto ? "border-2 border-red-500" : ""
            }`}
          />
        </div>

        {/* Múltiples métodos de pago */}
        <label className="flex items-center gap-2 p-4">
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
                  placeholder="Método"
                  value={pago.metodo}
                  onChange={(e) =>
                    handlePagoChange(index, "metodo", e.target.value)
                  }
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
        <div className="flex gap-4 mt-4 text-black p-6">
  <ResumenCliente cliente={clienteSeleccionado} onRemove={quitarCliente} />
  <ResumenVehiculo vehiculo={vehiculoSeleccionado} onRemove={quitarVehiculo} />
</div>

        <button
          type="submit"
          onClick={agregarVehiculoAlStock}
          className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg transition flex-1 bg-indigo-700 hover:bg-indigo-800"
        >
          <BadgeDollarSign size={28} /> Registrar venta
        </button>
      </motion.form>

      {modalOpen && clienteSeleccionado && (
  <ModalVehiculoPartePago
  onClose={() => setModalOpen(false)}
  onSave={(datosVehiculo) => {
    setVehiculoPartePago(datosVehiculo); // ahora está en memoria
    setModalOpen(false);
  }}
/>
)}
      <Listaventas />
      </div>
    </>
    
  );
}