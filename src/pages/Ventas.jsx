import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import BuscadorCliente from "../components/BuscadorCliente";
import BuscadorVehiculo from "../components/BuscadorVehiculo";
import ResumenCliente from "../components/ResumenCliente";
import ResumenVehiculo from "../components/ResumenVehiculo";
import ResumenVehiculoPartePago from "../components/ResumenVehiculoPartePago";
import {
  BadgeDollarSign,
  ShoppingCart,
  X,
  Trash,
  Plus,
  DollarSign,
  User,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import Listaventas from "../components/ListaVentas";
import ModalVehiculoPartePago from "../components/ModalVehiculoPartePago";
import exportarBoletoDOCX from "../components/boletos/exportarBoletoDOCX";
import Spinner from "../components/Spinner/Spinner";
import ListaDeudas from "../components/Deudas/ListaDeudas";

export default function NuevaVenta() {
  const [usuarios, setUsuarios] = useState([]);
  const [vendidoPor, setVendidoPor] = useState(""); // usuario seleccionado

  const [clienteId, setClienteId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const vehiculoSeleccionado = vehiculosDisponibles.find(
    (v) => v.id === vehiculoId
  );

  const [monto, setMonto] = useState("");
  const [pagosMultiples, setPagosMultiples] = useState(false);
  const [pagos, setPagos] = useState([{ metodo: "",  monto: "",  incluirEnCaja: true, fechaVencimiento: null }]);
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deudas, setDeudas] = useState([]);

  

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

  // Obtener info del cliente seleccionado

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

  // Obtener info del vehículo seleccionado
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vehiculos"), (snapshot) => {
      const disponibles = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((v) => v.estado === "Disponible");
      setVehiculosDisponibles(disponibles);
    });

    return () => unsub();
  }, []);

  const quitarCliente = () => {
    setClienteId("");
    setClienteSeleccionado(null);
  };

  const quitarVehiculo = () => {
    setVehiculoId("");
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


  const registrarEnCajaDiaria = async (descripcion, monto, tipo, fecha) => {
  try {
    await addDoc(collection(db, "caja_diaria"), {
      descripcion,
      monto: parseFloat(monto),
      tipo,
      fecha: Timestamp.fromDate(fecha ? new Date(fecha) : new Date()),
      createdAt: Timestamp.now(),
      creadoPor: user?.email || "Desconocido",
      relacionadoCon: "venta" // Puedes añadir más metadata
    });
  } catch (error) {
    console.error("Error registrando en caja diaria:", error);
    throw error;
  }
};


const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  // 1. Procesar los pagos
  const pagosProcesados = convertirPagosAFloat(pagos);
  
  // Definir pagosParaCaja y deudasRegistrar aquí
  const pagosParaCaja = pagosProcesados.filter(p => p.incluirEnCaja);
  const deudasRegistrar = pagosProcesados.filter(p => !p.incluirEnCaja);


  // Validaciones básicas
  if (!clienteSeleccionado) {
    toast.error("Selecciona un cliente");
    setIsSubmitting(false);
    return;
  }

  if (!vehiculoId) {
    toast.error("Selecciona un vehículo");
    setIsSubmitting(false);
    return;
  }

  if (!monto || parseFloat(monto) <= 0) {
    toast.error("Ingresa un monto válido");
    setIsSubmitting(false);
    return;
  }

  if (pagosParaCaja.length > 0) {
  for (const pago of pagosParaCaja) {
    await registrarEnCajaDiaria(
      `Venta vehículo (${pago.metodo})`,
      pago.monto,
      "ingreso",
      fechaVenta
    );
  }
}

  if (parteDePago && !vehiculoPartePago) {
    toast.error("Debes completar los datos del vehículo entregado en parte de pago.");
    setIsSubmitting(false);
    return;
  }

  try {
  
    // Crear resumen del vehículo
    const resumenVehiculo = {
      marca: vehiculoSeleccionado.marca || "",
      modelo: vehiculoSeleccionado.modelo || "",
      patente: vehiculoSeleccionado.patente || "",
      año: vehiculoSeleccionado.año || "",
      color: vehiculoSeleccionado.color || "",
      numeroChasis: vehiculoSeleccionado.chasis || "",
      numeroMotor: vehiculoSeleccionado.motor || "",
      precioVenta: vehiculoSeleccionado.precioVenta || 0,
    };

    // 1. Crear la venta principal
    const ventaRef = await addDoc(collection(db, "ventas"), {
      clienteId: clienteSeleccionado.id,
      vehiculoId,
      vehiculoResumen: resumenVehiculo,
      monto: parseFloat(monto),
      pagos: pagosMultiples ? pagosParaCaja : [],
      deudas: deudasRegistrar,
      fecha: Timestamp.fromDate(new Date(fechaVenta)),
      creadoPor: user?.email || "Desconocido",
      creadoEn: new Date(),
      vendidoPor,
      estado: deudasRegistrar.length > 0 ? "Pendiente" : "Completado"
    });

    // 2. Procesar parte de pago si corresponde
    if (parteDePago && vehiculoPartePago) {
      const vehiculoPartePagoRef = await addDoc(collection(db, "vehiculosPartePago"), {
        ...vehiculoPartePago,
        clienteId: clienteSeleccionado.id,
        clienteNombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        ventaId: ventaRef.id,
        fechaEntrega: new Date(),
        creadoPor: user?.email || "Desconocido",
        creadoEn: new Date(),
        recibidoPor: vehiculoPartePago.recibidoPor || "No especificado",
        vendidoPor,
        fecha: Timestamp.fromDate(new Date(fechaVenta)),
      });

      // Validación y registro del vehículo en parte de pago
      const vehiculoValido = vehiculoPartePago.marca || vehiculoPartePago.modelo || vehiculoPartePago.patente;
      if (vehiculoValido) {
        // Registrar en la colección de vehículos
        await addDoc(collection(db, "vehiculos"), {
          marca: vehiculoPartePago.marca?.trim() || "No especificado",
          modelo: vehiculoPartePago.modelo?.trim() || "No especificado",
          tipo: vehiculoPartePago.tipo?.trim() || "No especificado",
          patente: vehiculoPartePago.patente?.trim().toUpperCase() || "No especificado",
          año: parseInt(vehiculoPartePago.año) || null,
          color: vehiculoPartePago.color || "",
          etiqueta: "Usado",
          tomadoPor: user?.email || "",
          tomadoEn: new Date(),
          monto: parseFloat(vehiculoPartePago.monto) || 0,
          clienteNombre: clienteSeleccionado?.nombre || "",
          clienteApellido: clienteSeleccionado?.apellido || "",
          precioCompra: parseFloat(vehiculoPartePago.monto) || 0,
          estado: "Disponible",
          creadoPor: user?.email || "Desconocido",
          creadoEn: new Date(),
          fecha: Timestamp.fromDate(new Date(fechaVenta)),
        });

        // Registrar en la colección de compras
        await addDoc(collection(db, "compras"), {
          marca: vehiculoPartePago.marca?.trim() || "No especificado",
          modelo: vehiculoPartePago.modelo?.trim() || "No especificado",
          tipo: vehiculoPartePago.tipo?.trim() || "No especificado",
          patente: vehiculoPartePago.patente?.trim().toUpperCase() || "No especificado",
          año: parseInt(vehiculoPartePago.año) || null,
          color: vehiculoPartePago.color || "",
          etiqueta: "Usado",
          tomadoPor: user?.displayName || user?.email || "",
          tomadoEn: new Date(),
          monto: parseFloat(vehiculoPartePago.monto) || 0,
          clienteNombre: clienteSeleccionado?.nombre || "",
          clienteApellido: clienteSeleccionado?.apellido || "",
          precioCompra: parseFloat(vehiculoPartePago.monto) || 0,
          estado: "Disponible",
          creadoPor: user?.email || "Desconocido",
          creadoEn: new Date(),
          fecha: Timestamp.fromDate(new Date(fechaVenta)),
        });

        await updateDoc(doc(db, "ventas", ventaRef.id), {
          vehiculoPartePagoId: vehiculoPartePagoRef.id,
        });
      } else {
        console.warn("Vehículo parte de pago con datos insuficientes. No se guardó en 'vehiculos'.");
      }
    }

    // 3. Actualizar vehículo vendido
    await updateDoc(doc(db, "vehiculos", vehiculoId), {
      estado: "Vendido",
      clienteId: clienteSeleccionado.id,
      clienteNombre: clienteSeleccionado.nombre,
      clienteApellido: clienteSeleccionado.apellido,
      etiqueta: "Vendido",
      modificadoPor: user?.email || "",
      vendidoEn: new Date(),
      vendidoPor,
      monto: parseFloat(monto),
    });

    // 4. Registrar deudas si existen
    if (deudasRegistrar.length > 0) {
      await addDoc(collection(db, "deudas"), {
        ventaId: ventaRef.id,
        clienteId: clienteSeleccionado.id,
        clienteNombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        vehiculoId,
        vehiculoInfo: resumenVehiculo,
        deudas: deudasRegistrar,
        montoTotal: deudasRegistrar.reduce((sum, d) => sum + d.monto, 0),
        fechaVenta: Timestamp.fromDate(new Date(fechaVenta)),
        fechaCreacion: Timestamp.now(),
        estado: "Pendiente",
        creadoPor: user?.email || "Desconocido"
      });
    }

    toast.success("¡Venta registrada con éxito!");

    // Resetear formulario
    setClienteId("");
    setVehiculoId("");
    setMonto("");
    setClienteSeleccionado(null);
    setPagos([{ metodo: "", monto: "", incluirEnCaja: true }]);
    setPagosMultiples(false);
    setErrores({});
    setParteDePago(false);
    setVehiculoPartePago(null);

  } catch (error) {
    console.error("Error al registrar la venta:", error);
    toast.error("Error al registrar la venta. Por favor, inténtalo de nuevo.");
  } finally {
    setIsSubmitting(false);
  }
};


  const handlePagoChange = (index, campo, valor) => {
  const nuevosPagos = [...pagos];
  nuevosPagos[index][campo] = valor;
  setPagos(nuevosPagos);
};


 const agregarPago = () => {
  setPagos([...pagos, { 
    metodo: "", 
    monto: "", 
    incluirEnCaja: true,
    fechaVencimiento: null 
  }]);
};


  const quitarPago = (index) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="p-6 pt-20 min-h-screen bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-800 text-white">
        <h1 className="text-4xl font-bold mb-6 text-center flex justify-center items-center gap-2">
          <DollarSign className="w-10 h-10 text-lime-500 animate-bounce" />
          Gestión de Ventas
        </h1>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl  w-full  shadow-[0_0_60px_10px_rgba(8,234,19,0.521)] max-w-4xl mx-auto mb-10 border-3 border-lime-700"
        >
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart size={28} className="text-green-400" />
            <h2 className="text-2xl font-semibold">Registrar Nueva Venta</h2>
          </div>

          {/* Sección: Datos Venta */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-indigo-300">
              Datos de la venta
            </h3>
            <input
              type="date"
              value={fechaVenta}
              onChange={(e) => setFechaVenta(e.target.value)}
              className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </section>

          {/* Sección: Datos Venta */}
          <label className="text-sm text-white block mb-2">Vendido por:</label>
          <select
            value={vendidoPor}
            onChange={(e) => setVendidoPor(e.target.value)}
            className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
            required
          >
            <option value="">👨‍💼 Seleccione un usuario</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.nombre}>
                {usuario.nombre}
              </option>
            ))}
          </select>

          {/* Sección: Cliente y Vehículo */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div>
              <label className="block mb-1 text-sm font-medium text-white">
                Cliente
              </label>
              <BuscadorCliente
                value={clienteSeleccionado}
                onChange={setClienteSeleccionado}
                placeholder="Buscar Cliente..."
              />
            </div>

            {/* Vehículo */}
            <div>
              <label className="block mb-1 text-sm font-medium text-white">
                Vehículo
              </label>
              <BuscadorVehiculo
                value={vehiculoId}
                onChange={setVehiculoId}
                vehiculos={vehiculosDisponibles}
              />
            </div>
          </section>

          {/* Parte de pago */}
          <label className="flex items-center gap-2 p-6 text-white">
            <input
              type="checkbox"
              checked={parteDePago}
              onChange={() => setParteDePago(!parteDePago)}
            />
            Cliente entrega vehículo en parte de pago
          </label>

          {/* Sección: Monto */}
         
            <div className="pt-2">
            <div className="relative">
              <DollarSign
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"
                size={20}
              />
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
                placeholder="Monto del vehiculo a vender"
                className={`w-full pl-10 p-3 rounded bg-slate-700 text-white ${
                  errores.monto
                    ? "border-2 border-red-500"
                    : "border border-slate-600"
                }`}
              />
            </div>
            </div>
         

          {/* Métodos de pago */}
          <div className="space-y-2 p-6">
            <label className="flex items-center gap-2 text-white">
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
      <div key={index} className="flex flex-col gap-2 p-3  rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pago.incluirEnCaja}
            onChange={(e) => handlePagoChange(
              index, 
              "incluirEnCaja", 
              e.target.checked
            )}
            className="h-4 w-4 text-indigo-600 rounded"
          />
          <input
            type="text"
            placeholder="Método (ej: Efectivo, Transferencia)"
            value={pago.metodo}
            onChange={(e) =>
              handlePagoChange(index, "metodo", e.target.value)
            }
            className="flex-1 p-2 rounded border"
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
            className="w-28 p-2 rounded border"
          />
          <button
            type="button"
            onClick={() => quitarPago(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash size={18} />
          </button>
        </div>
        
        {!pago.incluirEnCaja && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Vencimiento:</label>
            <input
              type="date"
              value={pago.fechaVencimiento || ""}
              onChange={(e) => 
                handlePagoChange(index, "fechaVencimiento", e.target.value)
              }
              className="p-2 rounded border"
              required={!pago.incluirEnCaja}
            />
          </div>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={agregarPago}
      className="flex items-center text-sm text-blue-600 hover:underline"
    >
      <Plus size={18} className="mr-1" /> Agregar otro método
    </button>
  </div>
)}
          </div>

         <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg transition flex-1 ${
          isSubmitting ? "bg-green-400 cursor-not-allowed" : "bg-indigo-700 hover:bg-indigo-800"
        }`}
      >
        {isSubmitting ? <Spinner size={24} /> : <><BadgeDollarSign size={28} /> Registrar venta</>}
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
              />
            )}
          </div>
        </div>

        <Listaventas />
      </div>
      <div className="max-w-screen-xl mx-auto mt-8">
  <ListaDeudas />
</div>
    </>
  );
}
