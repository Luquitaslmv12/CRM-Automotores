import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth, signOut } from 'firebase/auth';
import Avatar from '../components/Avatar';

export default function Navbar() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setMenuUsuarioAbierto(false);
      }
    }

    if (menuUsuarioAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuUsuarioAbierto]);

  // Para cerrar menú al navegar
  const handleLinkClick = () => {
    setMenuAbierto(false);
    setMenuUsuarioAbierto(false);
  };

  // Función logout Firebase
  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setMenuUsuarioAbierto(false);
  };

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
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                to="/dashboard"
                className="text-white font-bold text-xl tracking-wide"
                onClick={handleLinkClick}
              >
                MiCRM
              </Link>
            </div>

            {/* Menú Desktop */}
            <div className="hidden md:flex space-x-4 items-center">
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
              <Link to="/presupuestos" className={linkClase('/presupuestos')}>
                Presupuestos
              </Link>
              {usuario?.rol === 'admin' && (
                <Link to="/admin" className={linkClase('/admin')}>
                  Admin
                </Link>
              )}
            </div>

            {/* Usuario Desktop */}
            {usuario && (
              <div className="relative max-w-[150px] hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setMenuUsuarioAbierto((v) => !v)}
                  className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded text-indigo-200 hover:text-white"
                  aria-haspopup="true"
                  aria-expanded={menuUsuarioAbierto}
                >
                  <Avatar usuario={usuario} size={32} />
                  <span className="max-w-xs truncate">{usuario.nombre || usuario.email}</span>
                  <svg
                    className={`w-4 h-4 text-indigo-300 transform transition-transform duration-200 ${
                      menuUsuarioAbierto ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {menuUsuarioAbierto && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      <Link
                        to="/perfil"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                        role="menuitem"
                        onClick={() => setMenuUsuarioAbierto(false)}
                      >
                        <User className="w-4 h-4 mr-2" /> Perfil
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Usuario + Botón hamburguesa móvil */}
            <div className="flex md:hidden items-center space-x-4">
              {usuario && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setMenuUsuarioAbierto((v) => !v)}
                    className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded text-indigo-200 hover:text-white truncate max-w-[120px]"
                    aria-haspopup="true"
                    aria-expanded={menuUsuarioAbierto}
                  >
                    <Avatar usuario={usuario} size={32} />
                    <span className="truncate">{usuario.nombre || usuario.email}</span>
                    <svg
                      className={`w-4 h-4 text-indigo-300 transform transition-transform duration-200 ${
                        menuUsuarioAbierto ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {menuUsuarioAbierto && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu"
                      >
                        <Link
                          to="/perfil"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                          role="menuitem"
                          onClick={() => setMenuUsuarioAbierto(false)}
                        >
                          <User className="w-4 h-4 mr-2" /> Perfil
                        </Link>
                        <button
                          onClick={logout}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Botón menú hamburguesa móvil */}
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
              <Link
                to="/presupuestos"
                className={linkClase('/presupuestos')}
                onClick={handleLinkClick}
              >
                Presupuestos
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

              {/* Opciones usuario móvil */}
              {usuario && (
                <>
                  <Link
                    to="/perfil"
                    className="block px-3 py-2 rounded-md text-indigo-200 hover:bg-indigo-500 hover:text-white"
                    onClick={handleLinkClick}
                  >
                    Perfil
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMenuAbierto(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-indigo-200 hover:bg-indigo-500 hover:text-white"
                  >
                    Cerrar sesión
                  </button>
                </>
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
