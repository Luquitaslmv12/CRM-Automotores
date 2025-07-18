import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { CreditCard, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import EstadoCuentaModal from "../proveedores/EstadoCuentaModal";
import { motion, AnimatePresence } from "framer-motion";
import { NumericFormat } from "react-number-format";

export default function CardSaldosProveedores() {
  const [saldos, setSaldos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reparacionesModal, setReparacionesModal] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  const ITEMS_POR_PAGINA = 5;

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true);

        const qReparaciones = query(
          collection(db, "reparaciones"),
          where("saldo", ">", 0)
        );
        const snapshotReparaciones = await getDocs(qReparaciones);
        const reparaciones = snapshotReparaciones.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const proveedorIds = [
          ...new Set(reparaciones.map((r) => r.tallerId).filter(Boolean)),
        ];

        const saldosPorProveedor = [];

        for (const id of proveedorIds) {
          const ref = doc(db, "proveedores", id);
          const snap = await getDoc(ref);
          const nombre = snap.exists()
            ? snap.data().nombre
            : "Proveedor desconocido";

          const saldoTotal = reparaciones
            .filter((r) => r.tallerId === id)
            .reduce((acc, r) => acc + (r.saldo || 0), 0);

          saldosPorProveedor.push({ id, nombre, saldo: saldoTotal });
        }

        // Ordenar por saldo descendente
        saldosPorProveedor.sort((a, b) => b.saldo - a.saldo);
        setSaldos(saldosPorProveedor);

        // Cargar vehículos
        const snapshotVehiculos = await getDocs(collection(db, "vehiculos"));
        const listaVehiculos = snapshotVehiculos.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVehiculos(listaVehiculos);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  const totalPaginas = Math.ceil(saldos.length / ITEMS_POR_PAGINA);
  const saldosPagina = saldos.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  // Calcular suma total
  const sumaTotal = saldos.reduce((acc, proveedor) => acc + proveedor.saldo, 0);

  // Función para abrir modal con reparaciones de un proveedor
  const abrirModal = async (proveedorId) => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "reparaciones"),
        where("saldo", ">", 0),
        where("tallerId", "==", proveedorId)
      );
      const snapshot = await getDocs(q);
      const reparacionesProveedor = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReparacionesModal(reparacionesProveedor);
      setModalAbierto(true);
    } catch (error) {
      console.error("Error al abrir modal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow border-l-4 border-green-500 min-h-80"
      >
        {/* Encabezado con total a la derecha */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg">
              <CreditCard className="text-green-400 w-5 h-5 sm:w-10 sm:h-10" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-100">
                Saldos a Proveedores
              </h3>
              <p className="text-xs sm:text-sm text-gray-300">
                Deudas pendientes por reparaciones
              </p>
            </div>
          </div>

          <div className="sm:ml-auto bg-green-700 text-white px-3 py-2 rounded-xl text-base sm:text-lg font-bold flex items-center gap-2">
            <NumericFormat
              value={sumaTotal}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="$"
              className="text-base sm:text-lg truncate"
            />
          </div>
        </div>

        {/* Contador de proveedores */}
        <div className="mb-4">
          <span className="text-xs sm:text-sm text-gray-400">
            Total:{" "}
            <span className="text-green-400 font-medium">{saldos.length}</span>{" "}
            {saldos.length !== 1 ? "proveedores" : "proveedor"}
          </span>
        </div>

        {/* Lista de proveedores */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-slate-700/50 rounded-md h-12"
              ></div>
            ))}
          </div>
        ) : saldos.length === 0 ? (
          <div className="bg-slate-800/30 rounded-lg p-4 text-center border border-slate-700/50">
            <p className="text-gray-300 text-sm sm:text-base">
              No hay saldos pendientes con proveedores
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <AnimatePresence>
              {saldosPagina.map(({ id, nombre, saldo }) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-800/40 hover:bg-slate-700/50 p-3 rounded-lg flex justify-between items-center cursor-pointer border border-slate-700/30 transition-colors"
                  onClick={() => abrirModal(id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-green-500/10 p-1.5 rounded-full">
                      <Plus className="text-green-400 w-4 h-4" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-gray-100 truncate">
                      {nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-green-400 whitespace-nowrap">
                      <NumericFormat
                        value={saldo}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$"
                      />
                    </span>
                    <ChevronRight className="text-gray-400 w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded bg-slate-800/50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <span className="text-xs sm:text-sm text-gray-300">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaActual === totalPaginas}
              className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded bg-slate-800/50"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <EstadoCuentaModal
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        reparaciones={reparacionesModal}
        vehiculos={vehiculos}
        loading={loading}
      />
    </>
  );
}
