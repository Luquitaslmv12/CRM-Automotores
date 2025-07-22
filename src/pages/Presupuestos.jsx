/* 
import ListaPresupuestos from "../components/ListaPresupuestos";

export default function NuevoPresupuesto() {

  


  return (
  
     
      <ListaPresupuestos />
  
  );
} */

// Archivo: NuevoPresupuesto.jsx

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

    if (!clienteSeleccionado) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!vehiculoId && !vehiculoPartePago) {
      toast.error("Selecciona un vehículo o ingresa uno en parte de pago");
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
        transition={{ duration: 0.4 }}
        className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl w-full shadow-[0_0_60px_10px_rgba(230,234,8,0.563)] p-6  w-full max-w-2xl mx-auto space-y-6 border-3 border-yellow-500"
      >
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-blue-400" />
          <h2 className="text-2xl font-semibold">Generar Presupuesto</h2>
        </div>

        <label className="block text-sm">Emitido por:</label>
        <select
          value={emitidoPor}
          onChange={(e) => setEmitidoPor(e.target.value)}
          className="w-full p-3 rounded bg-slate-700 text-white"
          required
        >
          <option value="">Seleccione un usuario</option>
          {usuarios.map((usuario) => (
           <option key={usuario.id} value={usuario.email}>
  {usuario.nombre} ({usuario.email})
</option>
          ))}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm block">Cliente</label>
            <BuscadorCliente
              value={clienteSeleccionado}
              onChange={setClienteSeleccionado}
            />
          </div>

          <div>
            <label className="text-sm block">Vehículo</label>
            <BuscadorVehiculo
              value={vehiculoId}
              onChange={setVehiculoId}
              vehiculos={vehiculosDisponibles}
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={parteDePago}
            onChange={() => setParteDePago(!parteDePago)}
          />
          Cliente entrega vehículo en parte de pago
        </label>

        {pagosMultiples && (
          <div className="space-y-3">
            {pagos.map((pago, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Método"
                  className="flex-1 p-2 rounded bg-slate-700 text-white"
                  value={pago.metodo}
                  onChange={(e) =>
                    handlePagoChange(i, "metodo", e.target.value)
                  }
                />
                <NumericFormat
                  value={pago.monto}
                  onValueChange={({ formattedValue }) =>
                    handlePagoChange(i, "monto", formattedValue)
                  }
                  thousandSeparator="."
                  decimalSeparator=","
                  className="w-32 p-2 rounded bg-slate-700 text-white"
                />
                <button
                  type="button"
                  onClick={() => setPagos(pagos.filter((_, idx) => idx !== i))}
                  className="text-red-400"
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPagos([...pagos, { metodo: "", monto: "" }])}
              className="text-blue-400"
            >
              <Plus size={18} /> Agregar pago
            </button>
          </div>
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pagosMultiples}
            onChange={() => setPagosMultiples(!pagosMultiples)}
          />
          Usar múltiples métodos de pago
        </label>

        {vehiculoId && (
          <div>
            <label>Monto</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
              <NumericFormat
                value={monto}
                onValueChange={({ floatValue }) => setMonto(floatValue)}
                thousandSeparator="."
                decimalSeparator=","
                className="w-full pl-10 p-3 rounded bg-slate-700 text-white"
                placeholder="Valor del vehículo de la agencia"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
        >
          <FileText className="inline mr-2" /> Generar presupuesto
        </button>
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
