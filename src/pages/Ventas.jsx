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
import ListaDeudas from "./ListaDeudas";

export default function NuevaVenta() {
  const [usuarios, setUsuarios] = useState([]);
  const [vendidoPor, setVendidoPor] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const vehiculoSeleccionado = vehiculosDisponibles.find(
    (v) => v.id === vehiculoId
  );

  const [monto, setMonto] = useState("");
  const [pagosMultiples, setPagosMultiples] = useState(false);
  const [pagos, setPagos] = useState([{ metodo: "", monto: "", incluirEnCaja: true, fechaVencimiento: null }]);
  const [errores, setErrores] = useState({});

  const [fechaVenta, setFechaVenta] = useState(() => {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires"
  });
  return hoy; // formato YYYY-MM-DD
});

  const [parteDePago, setParteDePago] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [vehiculoPartePagoId, setVehiculoPartePagoId] = useState(null);
  const [vehiculoPartePago, setVehiculoPartePago] = useState(null);
  const user = auth.currentUser;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deudas, setDeudas] = useState([]);
  const [diferencia, setDiferencia] = useState(0);

  useEffect(() => {
    if (parteDePago && vehiculoPartePago?.monto && monto) {
      const montoVehiculo = parseFloat(monto);
      const montoPartePago = parseFloat(vehiculoPartePago.monto);
      setDiferencia(montoVehiculo - montoPartePago);
    } else {
      setDiferencia(0);
    }
  }, [monto, vehiculoPartePago, parteDePago]);

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

  const registrarEnCajaDiaria = async (descripcion, monto, tipo, fecha, vehiculoInfo) => {
  try {
    await addDoc(collection(db, "caja_diaria"), {
      descripcion,
      monto: parseFloat(monto),
      tipo,
      fecha: Timestamp.fromDate(new Date(`${fecha}T00:00:00-03:00`)), 
      createdAt: Timestamp.now(),
      creadoPor: user?.email || "Desconocido",
      relacionadoCon: "venta",
      // Agregamos información del vehículo
      vehiculo: {
        patente: vehiculoInfo?.patente || "No especificado",
        marca: vehiculoInfo?.marca || "No especificado",
        modelo: vehiculoInfo?.modelo || "No especificado"
      },
      cliente: clienteSeleccionado ? {
        id: clienteSeleccionado.id,
        nombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
      } : null
    });
  } catch (error) {
    console.error("Error registrando en caja diaria:", error);
    throw error;
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  // Validación obligatoria de múltiples métodos de pago
  if (pagosMultiples && pagos.length === 0) {
    toast.error("Debe agregar al menos un método de pago");
    setIsSubmitting(false);
    return;
  }

  // Calculamos la diferencia real considerando si es a favor del cliente
  const montoVehiculo = parseFloat(monto || 0);
  const montoPartePago = parteDePago && vehiculoPartePago ? parseFloat(vehiculoPartePago.monto || 0) : 0;
  const diferenciaReal = montoVehiculo - montoPartePago;

  // Procesamos los pagos
  const pagosProcesados = convertirPagosAFloat(pagos);
  
  // Si la diferencia es a favor del cliente, ajustamos los montos
  if (diferenciaReal < 0) {
    // Buscamos el primer pago a caja diaria para restar la diferencia
    const pagoACajaIndex = pagosProcesados.findIndex(p => p.incluirEnCaja);
    if (pagoACajaIndex !== -1) {
      pagosProcesados[pagoACajaIndex].monto += diferenciaReal; // Sumamos (porque diferencia es negativa)
    }
  }

  const pagosParaCaja = pagosProcesados.filter(p => p.incluirEnCaja);
  const deudasRegistrar = pagosProcesados.filter(p => !p.incluirEnCaja);


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


    if (parteDePago && !vehiculoPartePago) {
      toast.error("Debes completar los datos del vehículo entregado en parte de pago.");
      setIsSubmitting(false);
      return;
    }

    try {
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



          if (pagosParaCaja.length > 0) {
    for (const pago of pagosParaCaja) {
      await registrarEnCajaDiaria(
        `Venta vehículo (${pago.metodo})`,
        pago.monto,
        "ingreso",
        fechaVenta, // Usamos directamente la fecha del input
        resumenVehiculo
      );
    }
  }


  if (diferenciaReal < 0) {
  await registrarEnCajaDiaria(
    `Devolución por diferencia - ${resumenVehiculo.marca} ${resumenVehiculo.modelo} (${resumenVehiculo.patente})`,
    Math.abs(diferenciaReal),
    "egreso",
    fechaVenta,
    resumenVehiculo
  );
}

      const ventaRef = await addDoc(collection(db, "ventas"), {
        clienteId: clienteSeleccionado.id,
        vehiculoId,
        vehiculoResumen: resumenVehiculo,
        monto: parseFloat(monto),
        pagos: pagosMultiples ? pagosParaCaja : [],
        deudas: deudasRegistrar,
        fecha: Timestamp.fromDate(new Date(`${fechaVenta}T00:00:00-03:00`)),
        creadoPor: user?.email || "Desconocido",
        creadoEn: new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
        vendidoPor,
        estado: deudasRegistrar.length > 0 ? "Pendiente" : "Completado"
      });

      if (parteDePago && vehiculoPartePago) {
        const vehiculoPartePagoRef = await addDoc(collection(db, "vehiculosPartePago"), {
          ...vehiculoPartePago,
          clienteId: clienteSeleccionado.id,
          clienteNombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
          ventaId: ventaRef.id,
          fechaEntrega: new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
          creadoPor: user?.email || "Desconocido",
          creadoEn: new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
          recibidoPor: vehiculoPartePago.recibidoPor || "No especificado",
          vendidoPor,
          fecha: Timestamp.fromDate(new Date(`${fechaVenta}T00:00:00-03:00`)),
        });

        const vehiculoValido = vehiculoPartePago.marca || vehiculoPartePago.modelo || vehiculoPartePago.patente;
        if (vehiculoValido) {
          await addDoc(collection(db, "vehiculos"), {
            marca: vehiculoPartePago.marca?.trim() || "No especificado",
            modelo: vehiculoPartePago.modelo?.trim() || "No especificado",
            tipo: vehiculoPartePago.tipo?.trim() || "No especificado",
            patente: vehiculoPartePago.patente?.trim().toUpperCase() || "No especificado",
            año: parseInt(vehiculoPartePago.año) || null,
            color: vehiculoPartePago.color || "",
            etiqueta: "Usado",
            tomadoPor: user?.email || "",
            tomadoEn: new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
            monto: parseFloat(vehiculoPartePago.monto) || 0,
            clienteNombre: clienteSeleccionado?.nombre || "",
            clienteApellido: clienteSeleccionado?.apellido || "",
            precioCompra: parseFloat(vehiculoPartePago.monto) || 0,
            estado: "Disponible",
            creadoPor: user?.email || "Desconocido",
            creadoEn: new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
            fecha: Timestamp.fromDate(new Date(`${fechaVenta}T00:00:00-03:00`)),
          });

          await addDoc(collection(db, "compras"), {
            marca: vehiculoPartePago.marca?.trim() || "No especificado",
            modelo: vehiculoPartePago.modelo?.trim() || "No especificado",
            tipo: vehiculoPartePago.tipo?.trim() || "No especificado",
            patente: vehiculoPartePago.patente?.trim().toUpperCase() || "No especificado",
            año: parseInt(vehiculoPartePago.año) || null,
            color: vehiculoPartePago.color || "",
            etiqueta: "Usado",
            tomadoPor: user?.displayName || user?.email || "",
            tomadoEn: new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
            monto: parseFloat(vehiculoPartePago.monto) || 0,
            clienteNombre: clienteSeleccionado?.nombre || "",
            clienteApellido: clienteSeleccionado?.apellido || "",
            precioCompra: parseFloat(vehiculoPartePago.monto) || 0,
            estado: "Disponible",
            creadoPor: user?.email || "Desconocido",
            creadoEn: new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
            fecha: Timestamp.fromDate(new Date(`${fechaVenta}T00:00:00-03:00`)),
          });

          await updateDoc(doc(db, "ventas", ventaRef.id), {
            vehiculoPartePagoId: vehiculoPartePagoRef.id,
          });
        }
      }

      await updateDoc(doc(db, "vehiculos", vehiculoId), {
        estado: "Vendido",
        clienteId: clienteSeleccionado.id,
        clienteNombre: clienteSeleccionado.nombre,
        clienteApellido: clienteSeleccionado.apellido,
        etiqueta: "Vendido",
        modificadoPor: user?.email || "",
        vendidoEn: new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
        vendidoPor,
        monto: parseFloat(monto),
      });

      if (deudasRegistrar.length > 0) {
        await addDoc(collection(db, "deudas"), {
          ventaId: ventaRef.id,
          clienteId: clienteSeleccionado.id,
          clienteNombre: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
          vehiculoId,
          vehiculoInfo: resumenVehiculo,
          deudas: deudasRegistrar.map((d) => ({
            ...d,
            id: `deuda_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            pagado: false,
            fechaPago: null,
            observaciones: "",
          })),
          montoTotal: deudasRegistrar.reduce((sum, d) => sum + d.monto, 0),
          fechaVenta: Timestamp.fromDate(new Date(fechaVenta)),
          fechaCreacion: Timestamp.now(),
          estado: "Pendiente",
          creadoPor: user?.email || "Desconocido"
        });
      }

      toast.success("¡Venta registrada con éxito!");

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
          className="bg-gradient-to-br from-slate-900 via-indigo-900/80 to-slate-900 backdrop-blur-lg p-8 rounded-3xl w-full shadow-[0_0_60px_10px_rgba(8,234,19,0.521)] max-w-4xl mx-auto mb-10 border-3 border-lime-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart size={28} className="text-green-400" />
            <h2 className="text-2xl font-semibold">Registrar Nueva Venta</h2>
          </div>

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

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <label className="flex items-center gap-2 p-6 text-white">
            <input
              type="checkbox"
              checked={parteDePago}
              onChange={() => setParteDePago(!parteDePago)}
            />
            Cliente entrega vehículo en parte de pago
          </label>

          <div className="pt-2 pb-2">
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

          <div className="space-y-4 p-6 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-white font-medium">
                <input
                  type="checkbox"
                  checked={pagosMultiples}
                  onChange={() => {
                    setPagosMultiples(!pagosMultiples);
                    if (!pagosMultiples) {
                      setPagos([{ metodo: "", monto: "", incluirEnCaja: true, fechaVencimiento: null }]);
                    }
                  }}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                Seleccionar Métodos de pago
                <span className="text-red-500">*</span>
              </label>
              
              {pagosMultiples && (
                <button
                  type="button"
                  onClick={agregarPago}
                  className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
                >
                  <Plus size={16} /> Agregar pago
                </button>
              )}
            </div>

            {pagosMultiples && (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-xs text-slate-300 font-medium px-2">
                  <div className="col-span-5">Método de pago</div>
                  <div className="col-span-3">Monto</div>
                  <div className="col-span-2">A caja diaria</div>
                  <div className="col-span-2">Acción</div>
                </div>

                {pagos.map((pago, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-800/50 p-3 rounded-lg">
                    <div className="col-span-5">
                      <select
                        value={pago.metodo}
                        onChange={(e) => handlePagoChange(index, "metodo", e.target.value)}
                        className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white"
                        required
                      >
                        <option value="">Seleccione método</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    
                    <div className="col-span-3">
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
                        className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2 flex justify-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pago.incluirEnCaja}
                          onChange={(e) => {
                            handlePagoChange(index, "incluirEnCaja", e.target.checked);
                            if (e.target.checked) {
                              handlePagoChange(index, "fechaVencimiento", null);
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => quitarPago(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                        disabled={pagos.length <= 1}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                    
                    {!pago.incluirEnCaja && (
                      <div className="col-span-12 mt-2">
                        <div className="flex items-center gap-2 bg-red-900/20 p-2 rounded border border-red-900/50">
                          <span className="text-sm text-red-300">Este pago generará una deuda</span>
                          <input
                            type="date"
                            value={pago.fechaVencimiento || ""}
                            onChange={(e) => 
                              handlePagoChange(index, "fechaVencimiento", e.target.value)
                            }
                            className="ml-auto p-1 rounded bg-slate-700 border border-slate-600 text-white text-sm"
                            required={!pago.incluirEnCaja}
                            min={fechaVenta}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="bg-slate-800/50 p-3 rounded-lg text-sm text-slate-300">
                  <div className="flex justify-between items-center mb-1">
                    <span>Total pagos a caja diaria:</span>
                    <span className="font-medium text-green-400">
                      {convertirPagosAFloat(pagos)
                        .filter(p => p.incluirEnCaja)
                        .reduce((sum, p) => sum + p.monto, 0)
                        .toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total en deudas:</span>
                    <span className="font-medium text-red-400">
                      {convertirPagosAFloat(pagos)
                        .filter(p => !p.incluirEnCaja)
                        .reduce((sum, p) => sum + p.monto, 0)
                        .toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {parteDePago && vehiculoPartePago && (
  <div className="p-6 bg-blue-900/20 rounded-lg border border-blue-800/50 mb-6">
    <h3 className="text-lg font-medium text-blue-300 mb-2">Resumen financiero</h3>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-slate-800/50 p-3 rounded">
        <div className="text-sm text-slate-400">Valor vehículo vendido</div>
        <div className="text-xl font-bold text-white">
          {parseFloat(monto || 0).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}
        </div>
      </div>
      <div className="bg-slate-800/50 p-3 rounded">
        <div className="text-sm text-slate-400">Valor vehículo en parte de pago</div>
        <div className="text-xl font-bold text-white">
          {parseFloat(vehiculoPartePago?.monto || 0).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}
        </div>
      </div>
      <div className={`p-3 rounded ${
        diferencia > 0 ? 'bg-green-900/30 border border-green-800/50' : 
        diferencia < 0 ? 'bg-red-900/30 border border-red-800/50' : 
        'bg-slate-800/50'
      }`}>
        <div className="text-sm text-slate-400">Diferencia</div>
        <div className={`text-xl font-bold ${
          diferencia > 0 ? 'text-green-400' : 
          diferencia < 0 ? 'text-red-400' : 
          'text-white'
        }`}>
          {Math.abs(diferencia).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}
          {diferencia < 0 && <span className="block text-xs mt-1">(a favor del cliente)</span>}
        </div>
      </div>
      <div className="bg-slate-800/50 p-3 rounded">
        <div className="text-sm text-slate-400">Total a registrar</div>
        <div className="text-xl font-bold text-white">
          {diferencia > 0 ? 
            diferencia.toLocaleString('es-AR', {style: 'currency', currency: 'ARS'}) :
            "0,00"}
        </div>
      </div>
    </div>
    {diferencia < 0 && (
      <div className="mt-3 p-2 bg-red-900/20 rounded text-sm text-red-300">
        El cliente recibirá {Math.abs(diferencia).toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})} de diferencia
      </div>
    )}
  </div>
)}

          <div className="pt-6">
            <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-lg transition flex-1 ${
              isSubmitting ? "bg-green-400 cursor-not-allowed" : "bg-indigo-700 hover:bg-indigo-800"
            }`}
          >
            {isSubmitting ? <Spinner size={24} /> : <><BadgeDollarSign size={28} /> Registrar venta</>}
          </button>
          </div>
        </motion.form>

        {modalOpen && clienteSeleccionado && (
          <ModalVehiculoPartePago
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
              />
            )}
          </div>
        </div>

        <Listaventas />
      </div>
      
    </>
  );
}