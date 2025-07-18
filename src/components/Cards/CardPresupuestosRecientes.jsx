import { useEffect, useState, useCallback, useRef } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Car,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import EstadoSelect, { estados } from "../presupuestos/EstadoSelect";

export default function CardPresupuestosRecientes() {
  const ITEMS_PER_PAGE = 2;
  const [estadoFiltro, setEstadoFiltro] = useState(estados[0]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [datosListos, setDatosListos] = useState(false);
  const loadingRef = useRef(false);

  const formatCurrency = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n);

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

  const cargarPresupuestos = useCallback(
    async (next = true, estado = estadoFiltro, reiniciar = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      let q;
      if (reiniciar) {
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
              where("estado", "==", estado.value),
              orderBy("fecha", "desc"),
              startAfter(lastVisible),
              limit(ITEMS_PER_PAGE)
            )
          : query(
              collection(db, "presupuestos"),
              where("estado", "==", estado.value),
              orderBy("fecha", "desc"),
              limit(ITEMS_PER_PAGE)
            );
      } else {
        const prevCursor =
          pageHistory.length > 1 ? pageHistory[pageHistory.length - 2] : null;
        q =
          prevCursor === null
            ? query(
                collection(db, "presupuestos"),
                where("estado", "==", estado.value),
                orderBy("fecha", "desc"),
                limit(ITEMS_PER_PAGE)
              )
            : query(
                collection(db, "presupuestos"),
                where("estado", "==", estado.value),
                orderBy("fecha", "desc"),
                startAt(prevCursor),
                limit(ITEMS_PER_PAGE)
              );
      }

      try {
        const snap = await getDocs(q);
        const docs = snap.docs;
        if (docs.length === 0) {
          setPresupuestos([]);
          return;
        }

        setLastVisible(docs[docs.length - 1]);
        setPageHistory((prev) =>
          next || reiniciar ? [...prev, docs[0]] : prev.slice(0, -1)
        );

        const datos = docs.map((docPres) => {
          const data = docPres.data();
          const cliente = clientes.find((c) => c.id === data.clienteId);
          const vehiculo = vehiculos.find((v) => v.id === data.vehiculoId);
          const parte = data.parteDePago;

          const montoVehiculo = Number(data.monto) || 0;
          const montoParte = Number(parte?.monto) || 0;
          const diferencia = montoVehiculo - montoParte;
          const porcentajeDiferencia =
            montoParte > 0 ? (diferencia / montoParte) * 100 : 0;

          return {
            id: docPres.id,
            cliente: cliente
              ? `${cliente.nombre} ${cliente.apellido}`
              : "Cliente no encontrado",
            vehiculo: vehiculo || null,
            vehiculoTexto: vehiculo
              ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`
              : "Vehículo no encontrado",
            montoVehiculo,
            parteDePago: parte || null,
            parteDePagoTexto: parte
              ? `${parte.marca || ""} ${parte.modelo || ""} (${
                  parte.patente || "-"
                })`
              : null,
            montoParte,
            diferencia,
            porcentajeDiferencia,
            fecha: data.fecha?.toDate() || null,
            estado: data.estado || "desconocido",
          };
        });

        setPresupuestos(datos);
      } catch (error) {
        console.error("Error cargando presupuestos:", error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [estadoFiltro, clientes, vehiculos, lastVisible, pageHistory]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      if (datosListos) {
        setLastVisible(null);
        setPageHistory([]);
        await cargarPresupuestos(true, estadoFiltro, true);
      }
    };
    loadInitialData();
  }, [datosListos, estadoFiltro]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm p-5 rounded-xl shadow-lg border-l-4 border-indigo-500 hover:shadow-indigo-500/10 transition-all min-h-80"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <ClipboardList className="text-indigo-400 w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            Presupuestos Recientes
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <EstadoSelect
            value={estadoFiltro}
            onChange={setEstadoFiltro}
            className="text-sm"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : presupuestos.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            No hay presupuestos {estadoFiltro.label.toLowerCase()}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {presupuestos.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm">
                        {p.fecha?.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }) || "Fecha no disponible"}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        p.diferencia >= 0
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {p.diferencia >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(p.porcentajeDiferencia).toFixed(1)}%
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">{p.cliente}</span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-700/50 rounded p-2">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Car className="w-4 h-4 text-indigo-400" />
                        <span>Agencia</span>
                      </div>
                      <div className="mt-1 text-white font-medium">
                        {p.vehiculoTexto}
                      </div>
                      <div className="mt-1 text-emerald-400 font-semibold">
                        {formatCurrency(p.montoVehiculo)}
                      </div>
                    </div>

                    {p.parteDePago && (
                      <div className="bg-slate-700/50 rounded p-2">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Car className="w-4 h-4 text-amber-400" />
                          <span>Cliente</span>
                        </div>
                        <div className="mt-1 text-white font-medium">
                          {p.parteDePagoTexto}
                        </div>
                        <div className="mt-1 text-amber-400 font-semibold">
                          {formatCurrency(p.montoParte)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Diferencia:{" "}
                    <span
                      className={`font-medium ${
                        p.diferencia >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {formatCurrency(Math.abs(p.diferencia))} (
                      {p.diferencia >= 0 ? "a favor" : "en contra"})
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => cargarPresupuestos(false)}
                disabled={pageHistory.length <= 1 || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Anterior</span>
              </button>

              <button
                onClick={() => cargarPresupuestos(true)}
                disabled={presupuestos.length < ITEMS_PER_PAGE || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-sm">Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
