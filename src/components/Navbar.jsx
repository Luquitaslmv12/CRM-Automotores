import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Para cerrar menú al navegar
  const handleLinkClick = () => setMenuAbierto(false);

  // Clases para link activo
  const linkClase = (ruta) =>
    `block px-3 py-2 rounded-md font-medium ${
      location.pathname === ruta
        ? 'bg-indigo-600 text-white'
        : 'text-indigo-200 hover:bg-indigo-500 hover:text-white'
    }`;

  return (
    <>
      <nav className="bg-indigo-800/60 fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Logo / Branding */}
            <div className="flex-shrink-0">
              <Link
                to="/dashboard"
                className="text-white font-bold text-xl tracking-wide"
                onClick={handleLinkClick}
              >
                MiCRM
              </Link>
            </div>

            {/* Menu Desktop */}
            <div className="hidden md:flex space-x-4">
              <Link to="/dashboard" className={linkClase('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/clientes" className={linkClase('/clientes')}>
                Clientes
              </Link>
              <Link to="/vehiculos" className={linkClase('/vehiculos')}>
                Vehículos
              </Link>
              <Link to="/ventas" className={linkClase('/ventas')}>
                Ventas
              </Link>
              {usuario?.rol === 'admin' && (
                <Link to="/admin" className={linkClase('/admin')}>
                  Admin
                </Link>
              )}
            </div>

            {/* Botón menú hamburguesa móvil */}
            <div className="md:hidden">
              <button
                onClick={() => setMenuAbierto((v) => !v)}
                className="text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded-md"
                aria-label="Abrir menú"
                aria-expanded={menuAbierto}
              >
                {menuAbierto ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {menuAbierto && (
          <div className="md:hidden border-t border-indigo-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/dashboard"
                className={linkClase('/dashboard')}
                onClick={handleLinkClick}
              >
                Dashboard
              </Link>
              <Link
                to="/clientes"
                className={linkClase('/clientes')}
                onClick={handleLinkClick}
              >
                Clientes
              </Link>
              <Link
                to="/vehiculos"
                className={linkClase('/vehiculos')}
                onClick={handleLinkClick}
              >
                Vehículos
              </Link>
              <Link
                to="/ventas"
                className={linkClase('/ventas')}
                onClick={handleLinkClick}
              >
                Ventas
              </Link>
              {usuario?.rol === 'admin' && (
                <Link
                  to="/admin"
                  className={linkClase('/admin')}
                  onClick={handleLinkClick}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Espacio para evitar que el contenido quede tapado por el navbar fijo */}
      <div className="h-14 md:h-14"></div>
    </>
  );
}
