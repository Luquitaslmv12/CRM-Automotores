import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { toast } from "react-hot-toast";

import { Plus, Save, Car, Trash2, Eye, Upload } from "lucide-react";

import ListadoCompras from "../components/compras/ListadoCompras";
import ModalVehiculoPartePago from "../components/ModalVehiculoPartePago";
import ResumenVehiculoPartePago from "../components/ResumenVehiculoPartePago";

// Componente de botón reutilizable
const Boton = ({ children, className = "", icon: Icon, ...props }) => (
  <button
    className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-all ${className}`}
    {...props}
  >
    {Icon && <Icon size={18} />}
    {children}
  </button>
);

// Componente de tarjeta reutilizable
const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-800 rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

export default function NuevaCompra() {
  const [modalOpen, setModalOpen] = useState(false);
  const [vehiculo, setVehiculo] = useState(null);
  const [vehiculoEditando, setVehiculoEditando] = useState(null);
  const [recibidoPor, setRecibidoPor] = useState("");
  const [compras, setCompras] = useState([]);

  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, "compras"));
    const unsub = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompras(datos);
    });
    return () => unsub();
  }, []);

  const handleGuardarVehiculo = async () => {
    if (!vehiculo) {
      toast.error("Debes ingresar los datos del vehículo.");
      return;
    }

    const datos = {
      marca: vehiculo.marca || "No especificado",
      modelo: vehiculo.modelo || "No especificado",
      tipo: vehiculo.tipo || "No especificado",
      patente: vehiculo.patente?.toUpperCase() || "No especificado",
      año: parseInt(vehiculo.año) || null,
      color: vehiculo.color || "",
      etiqueta: "Usado",
      tomadoPor: vehiculo.recibidoPor || "",
      cliente: vehiculo.cliente || null,
      tomadoEn: new Date(),
      monto: parseFloat(vehiculo.monto) || 0,
      precioCompra: parseFloat(vehiculo.monto) || 0,
      estado: "Disponible",
      creadoPor: user?.email || "Desconocido",
      creadoEn: new Date(),
      fechaIngreso: new Date(),
      /* recibidoPor: vehiculo.recibidoPor || "Desonocido", */
    };

    try {
      await addDoc(collection(db, "vehiculos"), datos);
      await addDoc(collection(db, "compras"), datos);
      toast.success("¡Vehículo ingresado al stock y registrado como compra!");
      setVehiculo(null);
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      toast.error("Error al guardar el vehículo.");
    }
  };

  const handleEliminarCompra = async (id) => {
    try {
      await deleteDoc(doc(db, "compras", id));
      toast.success("Compra eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar compra:", error);
      toast.error("Error al eliminar la compra.");
    }
  };

  const handleVerDetalle = (compra) => {
    toast(`Detalle de compra: ${compra.marca} ${compra.modelo}`);
  };

  const handleExportar = (compra) => {
    toast(`Exportar compra: ${compra.marca} ${compra.modelo}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-white space-y-6">
      <div className="flex flex-col items-center gap-2">
        <Car size={36} className="animate-bounce text-lime-500" />
        <h1 className="text-3xl font-bold tracking-tight">
          Gestión de Compras
        </h1>
      </div>

      <div className="flex justify-end">
        <Boton onClick={() => setModalOpen(true)} icon={Plus}>
          Agregar Compra
        </Boton>
      </div>

      {vehiculo && (
        <Card>
          <ResumenVehiculoPartePago
            vehiculo={vehiculo}
            onRemove={() => setVehiculo(null)}
            onClick={() => {
              setVehiculoEditando(vehiculo);
              setModalOpen(true);
            }}
          />
        </Card>
      )}

      <div className="flex justify-end">
        <Boton
          onClick={handleGuardarVehiculo}
          disabled={!vehiculo}
          icon={Save}
          className="bg-green-600 hover:bg-green-700"
        >
          Registrar Compra
        </Boton>
      </div>

      <ListadoCompras
        compras={compras}
        onVerDetalle={handleVerDetalle}
        onEliminar={handleEliminarCompra}
        onExportar={handleExportar}
        iconos={{ Eye, Trash2, Upload }}
      />

      {modalOpen && (
        <ModalVehiculoPartePago
          modo="compra"
          vehiculo={vehiculoEditando}
          onClose={() => {
            setModalOpen(false);
            setVehiculoEditando(null);
          }}
          onSave={(v) => {
            setVehiculo(v);
            setModalOpen(false);
            setVehiculoEditando(null);
          }}
        />
      )}
    </div>
  );
}
