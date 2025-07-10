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
import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import EstadoCuentaModal from "../proveedores/EstadoCuentaModal"; // Importá tu modal aquí

export default function CardSaldosProveedores() {
  const [saldos, setSaldos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reparacionesModal, setReparacionesModal] = useState([]);

  const ITEMS_POR_PAGINA = 3;

  useEffect(() => {
    const fetchSaldos = async () => {
      const q = query(collection(db, "reparaciones"), where("saldo", ">", 0));
      const snapshot = await getDocs(q);
      const reparaciones = snapshot.docs.map((doc) => ({
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
        const nombre = snap.exists() ? snap.data().nombre : "Proveedor desconocido";

        const saldoTotal = reparaciones
          .filter((r) => r.tallerId === id)
          .reduce((acc, r) => acc + (r.saldo || 0), 0);

        saldosPorProveedor.push({ id, nombre, saldo: saldoTotal });
      }

      setSaldos(saldosPorProveedor);
    };

    fetchSaldos();
  }, []);

  const totalPaginas = Math.ceil(saldos.length / ITEMS_POR_PAGINA);
  const saldosPagina = saldos.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  const formatoPesoArg = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  });

  // Función para abrir modal con reparaciones de un proveedor
  const abrirModal = async (proveedorId) => {
    // Buscar reparaciones con saldo > 0 y que sean del proveedor seleccionado
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
  };

  return (
    <>
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-6 rounded-xl shadow border-l-4 border-green-500">
        <div className="flex items-center gap-4 mb-2">
          <CreditCard className="text-green-500 w-8 h-8" />
          <h3 className="text-xl font-semibold flex-grow">Saldos Proveedores</h3>
        </div>

        <p className="text-2xl font-bold mb-2">
          {saldos.length} proveedor{(saldos.length !== 1) ? "es" : ""}
        </p>

        <div className="space-y-3 text-sm mb-2">
          {saldosPagina.map(({ id, nombre, saldo }) => (
            <div
              key={id}
              className="bg-gray-700 p-2 rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-600"
              onClick={() => abrirModal(id)}
            >
              <span className="text-white font-medium">{nombre}</span>
              <span className="text-green-400 font-semibold">
                {formatoPesoArg.format(saldo)}
              </span>
            </div>
          ))}
        </div>

        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-2 mt-2">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-1 text-gray-600 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaActual === totalPaginas}
              className="p-1 text-gray-600 hover:text-white disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <EstadoCuentaModal
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        reparaciones={reparacionesModal}
      />
    </>
  );
}
