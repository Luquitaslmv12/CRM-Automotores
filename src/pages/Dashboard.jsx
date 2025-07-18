import CardClientesMorosos from "../components/Cards/CardClientesMorosos";
import CardVehiculosNuevos from "../components/Cards/CardVehiculosNuevos";
import CardVehiculosUsados from "../components/Cards/CardVehiculosUsados";
import CardVehiculosReparacion from "../components/Cards/CardVehiculosReparacion";
import CardVentasDelMes from "../components/Cards/CardVentasDelMes";
import CardEvolucionVentas from "../components/Cards/CardEvolucionVentas";
import CardInteligenciaVentas from "../components/Cards/CardInteligenciaVentas";
import CardPresupuestosRecientes from "../components/Cards/CardPresupuestosRecientes";
import CardRendimientoVendedores from "../components/Cards/CardRendimientoVendedores";
import CardSaldosProveedores from "../components/Cards/CardSaldosProveedores";
import CardDeudasPendientes from "../components/Cards/CardDeudasPendientes";
import CardDeudasVencidas from "../components/Cards/CardDeudasVencidas";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Componente Skeleton Loading
const CardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
    className="bg-slate-800/30 rounded-xl p-6 h-48 border border-slate-700/50"
  >
    <div className="h-6 w-3/4 bg-slate-700 rounded-lg mb-4"></div>
    <div className="h-3 w-full bg-slate-700 rounded mb-2"></div>
    <div className="h-3 w-5/6 bg-slate-700 rounded mb-6"></div>
    <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
  </motion.div>
);

// Datos de los Tabs
const tabsData = [
  {
    id: "vehiculos",
    label: "Vehículos",
    cards: [
      { id: "v1", component: <CardVehiculosNuevos /> },
      { id: "v2", component: <CardVehiculosUsados /> },
      { id: "v3", component: <CardVehiculosReparacion /> },
      { id: "v4", component: <CardPresupuestosRecientes /> },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    cards: [
      { id: "s1", component: <CardVentasDelMes /> },
      { id: "s2", component: <CardEvolucionVentas /> },
      { id: "s3", component: <CardInteligenciaVentas /> },
      { id: "s4", component: <CardRendimientoVendedores /> },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    cards: [
      { id: "f1", component: <CardClientesMorosos /> },
      { id: "f2", component: <CardSaldosProveedores /> },
      { id: "f3", component: <CardDeudasPendientes /> },
      { id: "f4", component: <CardDeudasVencidas /> },
    ],
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(tabsData[0].id);
  const [loading, setLoading] = useState(true);

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-gray-100 pt-25">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header del Dashboard */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Menu Principal</h1>
          <p className="text-slate-400">Visualización integral de métricas</p>
        </motion.header>

        {/* Navegación por Tabs */}
        <nav className="flex space-x-1 mb-8 p-1 bg-slate-800/50 rounded-lg max-w-3xl border border-slate-700/50">
          {tabsData.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium relative rounded-md transition-colors ${
                activeTab === tab.id ? "text-white" : "text-slate-400"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Contenido de los Tabs */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <CardSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {tabsData
                  .find((tab) => tab.id === activeTab)
                  ?.cards.map((card) => (
                    <div key={card.id}>{card.component}</div>
                  ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
