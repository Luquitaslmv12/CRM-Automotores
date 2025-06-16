import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

export default function CardPresupuestosRecientes() {
  const ITEMS_PER_PAGE = 3;

  const [presupuestos, setPresupuestos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [lastVisible, setLastVisible] = useState(null); // cursor para siguiente página
  const [firstVisible, setFirstVisible] = useState(null); // cursor para página anterior
  const [pageHistory, setPageHistory] = useState([]); // stack para cursors previos
  const [loading, setLoading] = useState(false);
  const [datosListos, setDatosListos] = useState(false);

  useEffect(() => {
  const cargarClientesYVehiculos = async () => {
    const [snapClientes, snapVehiculos] = await Promise.all([
      getDocs(collection(db, "clientes")),
      getDocs(collection(db, "vehiculos")),
    ]);
    setClientes(snapClientes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setVehiculos(snapVehiculos.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setDatosListos(true); // ✅ ahora marcamos como listos
  };
  cargarClientesYVehiculos();
}, []);

useEffect(() => {
  if (datosListos) {
    cargarPresupuestos(); // ✅ solo cuando ya están los datos
  }
}, [datosListos]);

  const cargarPresupuestos = async (next = true) => {
    if (loading) return;
    setLoading(true);

    let q;
    if (next) {
      q = lastVisible
        ? query(
            collection(db, "presupuestos"),
            orderBy("fecha", "desc"),
            startAfter(lastVisible),
            limit(ITEMS_PER_PAGE)
          )
        : query(
            collection(db, "presupuestos"),
            orderBy("fecha", "desc"),
            limit(ITEMS_PER_PAGE)
          );
    } else {
      // Para ir hacia atrás, tomamos el último cursor guardado en pageHistory
      const prevCursor = pageHistory.length > 1 ? pageHistory[pageHistory.length - 2] : null;
      if (prevCursor === null) {
        // Volver a la primera página
        q = query(
          collection(db, "presupuestos"),
          orderBy("fecha", "desc"),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        q = query(
          collection(db, "presupuestos"),
          orderBy("fecha", "desc"),
          startAfter(prevCursor),
          limit(ITEMS_PER_PAGE)
        );
      }
    }

    try {
      const snap = await getDocs(q);

      const docs = snap.docs;
      setFirstVisible(docs[0]);
      setLastVisible(docs[docs.length - 1]);

      // Actualizamos el historial de páginas solo si vamos hacia adelante
      if (next) {
        setPageHistory((prev) => [...prev, docs[0]]);
      } else {
        setPageHistory((prev) => prev.slice(0, -1));
      }

      // Enriquecer los presupuestos con datos de cliente y vehículo
      const datos = docs.map((docPres) => {
        const data = docPres.data();
        const cliente = clientes.find(c => c.id === data.clienteId);
        const vehiculo = vehiculos.find(v => v.id === data.vehiculoId);

        return {
          id: docPres.id,
          cliente: cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente no encontrado",
          vehiculo: vehiculo
            ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
            : "Vehículo no encontrado",
          monto: data.monto || 0,
          fecha: data.fecha?.toDate().toLocaleDateString("es-AR") || "",
        };
      });

      setPresupuestos(datos);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border-l-4 border-indigo-500"
    >
      <div className="flex items-center gap-3 mb-4">
        <ClipboardList className="text-indigo-500 w-6 h-6" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Presupuestos recientes
        </h3>
      </div>

      {loading && <p>Cargando...</p>}

      {presupuestos.length === 0 && !loading ? (
        <p className="text-gray-600 dark:text-gray-300 text-sm">Sin presupuestos recientes.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            {presupuestos.map((p) => (
              <li key={p.id} className="py-2 flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{p.cliente}</span>
                  <span className="text-gray-600 dark:text-gray-300">{p.vehiculo}</span>
                  <span className="text-xs text-gray-400">{p.fecha}</span>
                </div>
                <div className="text-right">
                  <span className="text-indigo-600 font-semibold">
                    ${p.monto.toLocaleString("es-AR")}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => cargarPresupuestos(false)}
              disabled={pageHistory.length <= 1 || loading}
              className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              onClick={() => cargarPresupuestos(true)}
              disabled={presupuestos.length < ITEMS_PER_PAGE || loading}
              className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
