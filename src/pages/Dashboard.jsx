
import CardClientesMorosos from "../components/Cards/CardClientesMorosos";
import CardVehiculosNuevos from "../components/Cards/CardVehiculosNuevos";
import CardVehiculosUsados from "../components/Cards/CardVehiculosUsados";
import CardVehiculosReparacion from "../components/Cards/CardVehiculosReparacion";
import CardVentasDelMes from "../components/Cards/CardVentasDelMes";
import CardEvolucionVentas from "../components/Cards/CardEvolucionVentas";
import CardInteligenciaVentas from "../components/Cards/CardInteligenciaVentas";
import CardPresupuestosRecientes from "../components/Cards/CardPresupuestosRecientes";

export default function Dashboard() {


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
