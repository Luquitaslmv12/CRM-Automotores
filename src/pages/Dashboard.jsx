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

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 min-h-screen overflow-x-hidden text-gray-100 transition-colors">
      <div className="flex flex-col flex-1">
        <main className="p-6 pt-18 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          <CardClientesMorosos />
          <CardVehiculosNuevos />
          <CardVehiculosUsados />
          <CardVehiculosReparacion />
          <CardVentasDelMes />
          <CardEvolucionVentas />
          <CardInteligenciaVentas />
          <CardPresupuestosRecientes />
          <CardRendimientoVendedores />
          <CardSaldosProveedores />
          <CardDeudasPendientes />
          <CardDeudasVencidas />
        </main>
      </div>
    </div>
  );
}

/* import CardClientesMorosos from "../components/Cards/CardClientesMorosos";
import CardVehiculosNuevos from "../components/Cards/CardVehiculosNuevos";
import CardVehiculosUsados from "../components/Cards/CardVehiculosUsados";
import CardVehiculosReparacion from "../components/Cards/CardVehiculosReparacion";
import CardVentasDelMes from "../components/Cards/CardVentasDelMes";
import CardEvolucionVentas from "../components/Cards/CardEvolucionVentas";
import CardInteligenciaVentas from "../components/Cards/CardInteligenciaVentas";
import CardPresupuestosRecientes from "../components/Cards/CardPresupuestosRecientes";
import CardRendimientoVendedores from "../components/Cards/CardRendimientoVendedores";

export default function DashboardComercial() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-gray-100">
      
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/40 p-6 border-r border-indigo-700">
        <h2 className="text-2xl font-bold mb-6">Dashboard Comercial</h2>
       
      </aside>

     
      <main className="flex-1 p-6 overflow-auto">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Panel Comercial</h1>
         
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <CardClientesMorosos />
          <CardVehiculosNuevos />
          <CardVehiculosUsados />
          <CardVehiculosReparacion />
          <CardVentasDelMes />
          <CardEvolucionVentas />
          <CardInteligenciaVentas />
          <CardPresupuestosRecientes />
          <CardRendimientoVendedores />
        </section>
      </main>
    </div>
  );
}
 */
