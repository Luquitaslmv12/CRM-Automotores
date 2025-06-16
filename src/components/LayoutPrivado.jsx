import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Clientes from "../pages/Clientes";
import Vehiculos from "../pages/Vehiculos";
import Ventas from "../pages/Ventas";
import Perfil from "../pages/Perfil";
import Admin from "../pages/AgregarUsuario";
import NuevoPresupuesto from "../pages/Presupuestos";
import Navbar from "./Navbar";
import ProveedorDetalle from "../pages/ProveedorDetalle";
import { useAuth } from "../contexts/AuthContext";

export default function LayoutPrivado() {
  const { usuario, loading } = useAuth();

  if (loading) return <div className="text-white p-4">Cargando...</div>;
  if (!usuario) return <Navigate to="/login" />;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 min-h-screen overflow-x-hidden">
      <Navbar />
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="vehiculos" element={<Vehiculos />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="presupuestos" element={<NuevoPresupuesto />} />
        <Route path="proveedores/:id" element={<ProveedorDetalle />} />
        <Route
          path="admin"
          element={
            usuario.rol === "admin" ? <Admin /> : <Navigate to="/dashboard" />
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}
