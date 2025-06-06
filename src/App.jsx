import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Vehiculos from './pages/Vehiculos';
import Ventas from './pages/Ventas';
import Admin from './pages/AgregarUsuario';
import Navbar from './components/Navbar';

function PrivateRoute({ children, role }) {
  const { usuario, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!usuario) return <Navigate to="/login" />;

  // Si hay un rol específico requerido y el usuario no lo tiene, lo bloqueamos
  if (role && usuario.rol !== role) return <Navigate to="/dashboard" />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 min-h-screen">


                <Navbar />
                <Routes >
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="clientes" element={<Clientes />} />
                  <Route path="vehiculos" element={<Vehiculos />} />
                  <Route path="ventas" element={<Ventas />} />
                  <Route
                    path="admin"
                    element={
                      <PrivateRoute role="admin">
                        <Admin />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
                </div>
              </PrivateRoute>
            }
            
          />
          
        </Routes>
        
      </BrowserRouter>
    </AuthProvider>
    
  );
}