import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Truck,
  Users,
  DollarSign,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import CardClientesMorosos from "../components/Cards/CardClientesMorosos";
import CardVehiculosNuevos from "../components/Cards/CardVehiculosNuevos";
import CardVehiculosUsados from "../components/Cards/CardVehiculosUsados";
import CardVehiculosReparacion from "../components/Cards/CardVehiculosReparacion";
import CardVentasDelMes from "../components/Cards/CardVentasDelMes";
import CardEvolucionVentas from "../components/Cards/CardEvolucionVentas";
import CardInteligenciaVentas from "../components/Cards/CardInteligenciaVentas";
import CardPresupuestosRecientes from "../components/Cards/CardPresupuestosRecientes";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ vehiculos: 0, clientes: 0, ventas: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    // Acá iría la lógica para obtener los datos reales de Firestore
    setStats({
      vehiculos: 125,
      clientes: 12,
      ventas: 350000,
    });
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate("/");
  };

    return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Sidebar */}
      

      {/* Main Content */}
      <div className="flex flex-col flex-1">
    

        {/* Cards */}
        <main className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <CardClientesMorosos />
        <CardVehiculosNuevos />
        <CardVehiculosUsados />
        <CardVehiculosReparacion />
        <CardVentasDelMes />
        <CardEvolucionVentas />
        <CardInteligenciaVentas />
        <CardPresupuestosRecientes />

        </main>
        
      </div>
      
    </div>
  );
}
