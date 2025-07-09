import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  where,
  startAt,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import EstadoSelect, { estados } from "../presupuestos/EstadoSelect";

export default function CardPresupuestosRecientes() {
  const ITEMS_PER_PAGE = 3;

  const [estadoFiltro, setEstadoFiltro] = useState(estados[0]); // default: abierto

  const [presupuestos, setPresupuestos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [datosListos, setDatosListos] = useState(false);

  useEffect(() => {
    const cargarClientesYVehiculos = async () => {
      const [snapClientes, snapVehiculos] = await Promise.all([
        getDocs(collection(db, "clientes")),
        getDocs(collection(db, "vehiculos")),
      ]);
      setClientes(
        snapClientes.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setVehiculos(
        snapVehiculos.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setDatosListos(true);
    };
    cargarClientesYVehiculos();
  }, []);

  useEffect(() => {
    if (datosListos) {
      // Reiniciar paginación cuando cambia el filtro
      setLastVisible(null);
      setPageHistory([]);
      cargarPresupuestos(true, estadoFiltro, true); // forzar recarga desde cero
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosListos, estadoFiltro]);

  const cargarPresupuestos = async (
    next = true,
    estado = estadoFiltro,
    reiniciar = false
  ) => {
    if (loading) return;
    setLoading(true);

    let q;
    if (reiniciar) {
      // Carga inicial sin cursor
      q = query(
        collection(db, "presupuestos"),
        where("estado", "==", estado.value),
        orderBy("fecha", "desc"),
        limit(ITEMS_PER_PAGE)
      );
    } else if (next) {
      q = lastVisible
        ? query(
            collection(db, "presupuestos"),
            where("estado", "==", estado),
            orderBy("fecha", "desc"),
            startAfter(lastVisible),
            limit(ITEMS_PER_PAGE)
          )
        : query(
            collection(db, "presupuestos"),
            where("estado", "==", estado),
            orderBy("fecha", "desc"),
            limit(ITEMS_PER_PAGE)
          );
    } else {
      const prevCursor =
        pageHistory.length > 1 ? pageHistory[pageHistory.length - 2] : null;
      if (prevCursor === null) {
        q = query(
          collection(db, "presupuestos"),
          where("estado", "==", estado),
          orderBy("fecha", "desc"),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        q = query(
          collection(db, "presupuestos"),
          where("estado", "==", estado),
          orderBy("fecha", "desc"),
          startAt(prevCursor),
          limit(ITEMS_PER_PAGE)
        );
      }
    }

    try {
      const snap = await getDocs(q);
      const docs = snap.docs;
      if (docs.length === 0) {
        setLoading(false);
        setPresupuestos([]);
        return;
      }

      setLastVisible(docs[docs.length - 1]);
      if (next || reiniciar) {
        setPageHistory((prev) => [...prev, docs[0]]);
      } else {
        setPageHistory((prev) => prev.slice(0, -1));
      }

      const datos = docs.map((docPres) => {
        const data = docPres.data();
        const cliente = clientes.find((c) => c.id === data.clienteId);
        const vehiculo = vehiculos.find((v) => v.id === data.vehiculoId);
        const parte = data.parteDePago;

        const montoVehiculo = Number(data.monto) || 0;
        const montoParte = Number(parte?.monto) || 0;
        const diferencia = montoVehiculo - montoParte;

        return {
          id: docPres.id,
          cliente: cliente
            ? `${cliente.nombre} ${cliente.apellido}`
            : "Cliente no encontrado",
          vehiculoTexto:
            vehiculo && vehiculo.marca && vehiculo.modelo
              ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
              : "Vehículo no encontrado",
          montoVehiculo,
          parteDePagoTexto: parte
            ? `${parte.marca || ""} ${parte.modelo || ""} (${
                parte.patente || "-"
              })`
            : null,
          montoParte,
          diferencia,
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
      className="bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-sm p-5 rounded-xl shadow border-l-4 border-indigo-500"
    >
      <div className="flex items-center gap-3 mb-4">
        <ClipboardList className="text-indigo-500 w-6 h-6" />
        <h3 className="text-lg font-semibold text-gray-100">
          Presupuestos recientes
        </h3>
        <EstadoSelect value={estadoFiltro} onChange={setEstadoFiltro} />
      </div>

      {loading && <p>Cargando...</p>}

      {presupuestos.length === 0 && !loading ? (
        <p className="text-gray-300 text-sm">
          Sin presupuestos recientes.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-gray-700 text-sm">
            {presupuestos.map((p) => (
              <li key={p.id} className="py-3 relative">
                <div
                  className={`absolute top-3 right-3 text-xs font-semibold
                    px-2 py-1 rounded bg-opacity-70
                    ${
                      p.diferencia >= 0
                        ? "bg-green-700 text-white"
                        : "bg-red-700 text-white"
                    }
                  `}
                  style={{ minWidth: "80px", textAlign: "center" }}
                >
                  {p.diferencia.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-100">
                    {p.fecha} {p.cliente}
                  </span>
                  <div className="flex justify-between">
                    <span className="text-indigo-300 font-semibold">
                      Agencia: {p.vehiculoTexto}
                    </span>
                    <span className="text-lime-400 font-semibold">
                      {p.montoVehiculo.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </span>
                  </div>
                  {p.parteDePagoTexto && (
                    <div className="flex justify-between">
                      <span className="text-yellow-400 font-semibold">
                        Cliente : {p.parteDePagoTexto}
                      </span>
                      <span className="text-yellow-400 font-semibold">
                        {p.montoParte.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })}
                      </span>
                    </div>
                  )}
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
