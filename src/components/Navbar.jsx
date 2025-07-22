import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Menu, X, LogOut, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, signOut } from "firebase/auth";
import Avatar from "../components/Avatar";
import { createPortal } from "react-dom";


function MovimientosDropdown() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        !document.getElementById("movimientos-menu")?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center px-3 py-2 rounded-md font-medium text-indigo-200 hover:bg-indigo-500 hover:text-white"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Movimientos <ChevronDown className="ml-1 w-4 h-4" />
      </button>

      {open &&
        createPortal(
          <div
            id="movimientos-menu"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              backgroundColor: "#3730a3", // bg-indigo-800
              borderRadius: "0.375rem",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              zIndex: 9999,
              minWidth: "180px",
              padding: "0.5rem 0",
            }}
            role="menu"
            aria-orientation="vertical"
          >
            <Link
              to="/cajadiaria"
              className="block px-4 py-2 text-indigo-200 hover:bg-indigo-600 hover:text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Caja Diaria
            </Link>
            <Link
              to="/caja"
              className="block px-4 py-2 text-indigo-200 hover:bg-indigo-600 hover:text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Movimientos Vehiculos
            </Link>
            <Link
              to="/Listadeudas"
              className="block px-4 py-2 text-indigo-200 hover:bg-indigo-600 hover:text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Lista de Deudas
            </Link>
          </div>,
          document.body
        )}
    </>
  );
}


function OperacionesDropdown() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        !document.getElementById("operaciones-menu")?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center px-3 py-2 rounded-md font-medium text-indigo-200 hover:bg-indigo-500 hover:text-white"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Operaciones <ChevronDown className="ml-1 w-4 h-4" />
      </button>

      {open &&
        createPortal(
          <div
            id="operaciones-menu"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              backgroundColor: "#3730a3", // bg-indigo-800
              borderRadius: "0.375rem",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              zIndex: 9999,
              minWidth: "180px",
              padding: "0.5rem 0",
            }}
            role="menu"
            aria-orientation="vertical"
          >
            <Link
              to="/ventas"
              className="block px-4 py-2 text-indigo-200 hover:bg-indigo-600 hover:text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Ventas
            </Link>
            <Link
              to="/compras"
              className="block px-4 py-2 text-indigo-200 hover:bg-indigo-600 hover:text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Compras
            </Link>
            <Link
              to="/presupuestos"
              className="block px-4 py-2 text-indigo-200 hover:bg-indigo-600 hover:text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Presupuestos
            </Link>
          </div>,
          document.body
        )}
    </>
  );
}

export default function Navbar() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [operacionesAbierto, setOperacionesAbierto] = useState(false);
  const [movimientosAbierto, setMovimientosAbierto] = useState(false);

  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setMenuUsuarioAbierto(false);
      }
    }

    if (menuUsuarioAbierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuUsuarioAbierto]);

  const handleLinkClick = () => {
    setMenuAbierto(false);
    setMenuUsuarioAbierto(false);
  };

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setMenuUsuarioAbierto(false);
  };

  const linkClase = (ruta) =>
    `block px-3 py-2 rounded-md font-medium ${
      location.pathname === ruta
        ? "bg-indigo-600 text-white"
        : "text-indigo-200 hover:bg-indigo-500 hover:text-white"
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
            <div className="hidden md:flex space-x-2 items-center">
  <Link to="/dashboard" className={linkClase("/dashboard")}>
    Dashboard
  </Link>
  <Link to="/clientes" className={linkClase("/clientes")}>
    Clientes
  </Link>
  <Link to="/vehiculos" className={linkClase("/vehiculos")}>
    Vehículos
  </Link>

  {/* Dropdown Operaciones */}
  <OperacionesDropdown />
  
  {/* Nuevo Dropdown Movimientos */}
  <MovimientosDropdown />

  <Link to="/proveedores" className={linkClase("/proveedores")}>
    Proveedores
  </Link>
  <Link to="/reparaciones" className={linkClase("/reparaciones")}>
    Reparaciones
  </Link>
  {usuario?.rol === "admin" && (
    <Link to="/admin" className={linkClase("/admin")}>
      Admin
    </Link>
  )}
</div>

            {/* Usuario Desktop */}
            {usuario && (
              <div
                className="relative max-w-[150px] hidden md:block"
                ref={userMenuRef}
              >
                <button
                  onClick={() => setMenuUsuarioAbierto((v) => !v)}
                  className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded text-indigo-200 hover:text-white"
                  aria-haspopup="true"
                  aria-expanded={menuUsuarioAbierto}
                >
                  <Avatar usuario={usuario} size={32} />
                  <span className="max-w-xs truncate">
                    {usuario.nombre || usuario.email}
                  </span>
                  <svg
                    className={`w-4 h-4 text-indigo-300 transform transition-transform duration-200 ${
                      menuUsuarioAbierto ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
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
                    <span className="truncate">
                      {usuario.nombre || usuario.email}
                    </span>
                    <svg
                      className={`w-4 h-4 text-indigo-300 transform transition-transform duration-200 ${
                        menuUsuarioAbierto ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
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

              <button
                onClick={() => setMenuAbierto((v) => !v)}
                className="text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md"
                aria-label="Abrir menú"
              >
                {menuAbierto ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        <AnimatePresence>
          {menuAbierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-indigo-700/95"
            >
              <nav className="px-2 pt-2 pb-4 space-y-1">
                <Link
                  to="/dashboard"
                  className={linkClase("/dashboard")}
                  onClick={handleLinkClick}
                >
                  Dashboard
                </Link>
                <Link
                  to="/clientes"
                  className={linkClase("/clientes")}
                  onClick={handleLinkClick}
                >
                  Clientes
                </Link>
                <Link
                  to="/vehiculos"
                  className={linkClase("/vehiculos")}
                  onClick={handleLinkClick}
                >
                  Vehículos
                </Link>

                {/* Para móvil, dropdown simple */}
                <div>
                  <button
                    onClick={() => setOperacionesAbierto((v) => !v)}
                    className="w-full text-left px-3 py-2 rounded-md font-medium text-indigo-200 hover:bg-indigo-500 hover:text-white flex justify-between items-center"
                  >
                    Operaciones <ChevronDown className="ml-1 w-4 h-4" />
                  </button>
                  {operacionesAbierto && (
                    <div className="pl-4 space-y-1">
                      <Link
                        to="/ventas"
                        className={linkClase("/ventas")}
                        onClick={() => {
                          handleLinkClick();
                          setOperacionesAbierto(false);
                        }}
                      >
                        Ventas
                      </Link>
                      <Link
                        to="/compras"
                        className={linkClase("/compras")}
                        onClick={() => {
                          handleLinkClick();
                          setOperacionesAbierto(false);
                        }}
                      >
                        Compras
                      </Link>
                      <Link
                        to="/presupuestos"
                        className={linkClase("/presupuestos")}
                        onClick={() => {
                          handleLinkClick();
                          setOperacionesAbierto(false);
                        }}
                      >
                        Presupuestos
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  to="/proveedores"
                  className={linkClase("/proveedores")}
                  onClick={handleLinkClick}
                >
                  Proveedores
                </Link>
                <Link
                  to="/reparaciones"
                  className={linkClase("/reparaciones")}
                  onClick={handleLinkClick}
                >
                  Reparaciones
                </Link>
                <Link
                  to="/caja"
                  className={linkClase("/caja")}
                  onClick={handleLinkClick}
                >
                  Caja
                </Link>
                {usuario?.rol === "admin" && (
                  <Link
                    to="/admin"
                    className={linkClase("/admin")}
                    onClick={handleLinkClick}
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
