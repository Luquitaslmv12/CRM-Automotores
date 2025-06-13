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

  const navItems = [
    { name: "Inicio", icon: <LayoutDashboard />, href: "/dashboard" },
    { name: "Vehículos", icon: <Truck />, href: "/vehiculos" },
    { name: "Clientes", icon: <Users />, href: "/clientes" },
    { name: "Ventas", icon: <DollarSign />, href: "/ventas" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed z-40 inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg p-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Panel</h2>
              <button onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-4">
              {navItems.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="flex items-center gap-3 p-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-700 transition"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Navbar */}
        <header className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold hidden md:block">Menú Principal</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-indigo-800 px-4 py-2 rounded hover:bg-indigo-900 transition flex items-center gap-2"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </header>

        {/* Cards */}
        <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Vehículos",
              value: stats.vehiculos,
              icon: <Truck className="text-indigo-600 w-8 h-8" />,
            },
            {
              label: "Clientes",
              value: stats.clientes,
              icon: <Users className="text-indigo-600 w-8 h-8" />,
            },
            {
              label: "Ventas",
              value: formatCurrency(stats.ventas),
              icon: <DollarSign className="text-indigo-600 w-8 h-8" />,
            },
            
              
            
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition flex flex-col gap-2"
            >
              <div className="flex items-center gap-4">
                {card.icon}
                <h3 className="text-xl font-semibold">{card.label}</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg pl-12">{card.value}</p>
            </motion.div>
            
          ))}
        </main>
        <CardClientesMorosos />
        <CardVehiculosNuevos />
        <CardVehiculosUsados />
        <CardVehiculosReparacion />
      </div>
      
    </div>
  );
}
