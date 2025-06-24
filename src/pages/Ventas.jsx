import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
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
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import Listaventas from "../components/ListaVentas";
import ModalVehiculoPartePago from "../components/ModalVehiculoPartePago";
import exportarBoletoDOCX from "../components/boletos/exportarBoletoDOCX";


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


  useEffect(() => {
  const fetchUsuarios = async () => {
    const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
    const usuariosList = usuariosSnapshot.docs.map(doc => ({
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
      const snap = await getDocs(collection(db, "clientes"));
      const cliente = snap.docs.find((doc) => doc.id === clienteId);
      if (cliente)
        setClienteSeleccionado({ id: cliente.id, ...cliente.data() });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pagosProcesados = convertirPagosAFloat(pagos);
    const nuevosErrores = {};

    // Validaciones básicas
    if (!clienteSeleccionado) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!vehiculoId) nuevosErrores.vehiculoId = true;
    if (!monto) nuevosErrores.monto = true;
    if (parteDePago && !vehiculoPartePago) {
      toast.error(
        "Debes completar los datos del vehículo entregado en parte de pago."
      );
      return;
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    try {
      // 1. Crear la venta
      const ventaRef = await addDoc(collection(db, "ventas"), {
        clienteId: clienteSeleccionado.id,
        vehiculoId,
        monto: parseFloat(monto),
        pagos: pagosMultiples ? pagosProcesados : [],
        fecha: Timestamp.fromDate(new Date(fechaVenta)),
        creadoPor: user?.email || "Desconocido",
        creadoEn: new Date(),
        vendidoPor,
      });

      // 2. Procesar parte de pago si corresponde
      if (parteDePago && vehiculoPartePago) {
        const vehiculoPartePagoRef = await addDoc(
          collection(db, "vehiculosPartePago"),
          {
            ...vehiculoPartePago,
            clienteId: clienteSeleccionado.id,
            clienteNombre: clienteSeleccionado.nombre,
            clienteApellido: clienteSeleccionado.apellido,
            ventaId: ventaRef.id,
            fechaEntrega: new Date(),
            creadoPor: user?.email || "Desconocido",
            creadoEn: new Date(),
             recibidoPor: vehiculoPartePago.recibidoPor || "No especificado",
             vendidoPor,
          }
        );
console.log("Vehículo parte de pago:", vehiculoPartePago);



        // Validación mínima antes de guardar en "vehiculos"
        const vehiculoValido =
          vehiculoPartePago.marca ||
          vehiculoPartePago.modelo ||
          vehiculoPartePago.patente;
        if (vehiculoValido) {
          await addDoc(collection(db, "vehiculos"), {
            marca: vehiculoPartePago.marca?.trim() || "No especificado",
            modelo: vehiculoPartePago.modelo?.trim() || "No especificado",
            tipo: vehiculoPartePago.tipo?.trim() || "No especificado",
            patente:
              vehiculoPartePago.patente?.trim().toUpperCase() ||
              "No especificado",
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
            fechaIngreso: new Date(),
          });

          await updateDoc(doc(db, "ventas", ventaRef.id), {
            vehiculoPartePagoId: vehiculoPartePagoRef.id,
          });
        } else {
          console.warn(
            "Vehículo parte de pago con datos insuficientes. No se guardó en 'vehiculos'."
          );
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
      });

      toast.success("¡Venta registrada con éxito!");

      // 4. Resetear formulario
      setClienteId("");
      setVehiculoId("");
      setMonto("");
      setClienteSeleccionado(null);
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
          className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-2xl mx-auto mb-8 space-y-6"
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
  <option value="">Seleccione un usuario</option>
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
          <label className="flex items-center gap-2 p-2 text-white">
            <input
              type="checkbox"
              checked={parteDePago}
              onChange={() => setParteDePago(!parteDePago)}
            />
            Cliente entrega vehículo en parte de pago
          </label>

          {/* Sección: Monto */}
          <div>
            <label className="block mb-1 text-sm font-medium text-white">
              Monto de la venta
            </label>
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
                placeholder="Monto total de la venta"
                className={`w-full pl-10 p-3 rounded bg-slate-700 text-white ${
                  errores.monto
                    ? "border-2 border-red-500"
                    : "border border-slate-600"
                }`}
              />
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-2">
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
          </div>

          {/* Botón */}
          <button
            type="submit"
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
