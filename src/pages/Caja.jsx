import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Caja() {
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(
    dayjs().format("YYYY-MM")
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMovimientos = async () => {
      setLoading(true);
      try {
        const [ventasSnap, comprasSnap] = await Promise.all([
          getDocs(collection(db, "ventas")),
          getDocs(collection(db, "compras")),
        ]);

        const mes = dayjs(mesSeleccionado);

        const ingresosFiltrados = ventasSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((v) =>
            dayjs(v.fecha?.toDate?.() || v.fecha).isSame(mes, "month")
          );

        const egresosFiltrados = comprasSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((v) =>
            dayjs(v.fechaIngreso?.toDate?.() || v.fechaIngreso).isSame(
              mes,
              "month"
            )
          );

        setIngresos(ingresosFiltrados);
        setEgresos(egresosFiltrados);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, [mesSeleccionado]);

  const totalIngresos = ingresos.reduce(
    (acc, v) => acc + Number(v.monto || 0),
    0
  );
  const totalEgresos = egresos.reduce(
    (acc, v) => acc + Number(v.precioCompra || v.monto || 0),
    0
  );
  const saldo = totalIngresos - totalEgresos;

  // Formatear fecha para mostrar
  const mesMostrado = dayjs(mesSeleccionado).locale("es").format("MMMM YYYY");

  return (
    <div className="pt-14">
      <motion.div
        className="p-4  md:p-6 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Wallet className="text-blue-600 w-8 h-8" />
              <span>Resumen de Caja</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Resumen financiero del mes seleccionado
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border p-2">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <input
              type="month"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="border-none bg-transparent focus:outline-none focus:ring-0 text-gray-700 font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Resumen de{" "}
                {mesMostrado.charAt(0).toUpperCase() + mesMostrado.slice(1)}
              </h2>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 shadow-sm border border-green-100"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Ingresos
                      </p>
                      <p className="text-2xl font-bold text-green-800 mt-1">
                        {totalIngresos.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <TrendingUp className="text-green-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-green-700">
                    {ingresos.length}{" "}
                    {ingresos.length === 1 ? "transacción" : "transacciones"}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 shadow-sm border border-red-100"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Egresos
                      </p>
                      <p className="text-2xl font-bold text-red-800 mt-1">
                        {totalEgresos.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })}
                      </p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <TrendingDown className="text-red-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-red-700">
                    {egresos.length}{" "}
                    {egresos.length === 1 ? "transacción" : "transacciones"}
                  </div>
                </motion.div>

                <motion.div
                  className={`bg-gradient-to-br rounded-xl p-5 shadow-sm border ${
                    saldo >= 0
                      ? "from-blue-50 to-blue-100 border-blue-100"
                      : "from-orange-50 to-orange-100 border-orange-100"
                  }`}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Saldo neto
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 ${
                          saldo >= 0 ? "text-blue-800" : "text-orange-800"
                        }`}
                      >
                        {saldo.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        saldo >= 0 ? "bg-blue-100" : "bg-orange-100"
                      }`}
                    >
                      <Wallet
                        className={`w-6 h-6 ${
                          saldo >= 0 ? "text-blue-600" : "text-orange-600"
                        }`}
                      />
                    </div>
                  </div>
                  <div
                    className={`mt-3 text-xs ${
                      saldo >= 0 ? "text-blue-700" : "text-orange-700"
                    }`}
                  >
                    {saldo >= 0 ? "Positivo" : "Negativo"} este mes
                  </div>
                </motion.div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                className="bg-white/70 rounded-xl shadow-sm border p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <PlusCircle className="text-green-500 w-5 h-5" />
                    Ingresos
                  </h2>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {ingresos.length} registros
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {ingresos.length > 0 ? (
                      ingresos.map((v) => (
                        <motion.div
                          key={v.id}
                          className="bg-green-50 rounded-lg p-3 border border-green-100"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">
                                {v.vehiculoResumen?.marca || "Vehículo"}{" "}
                                {v.vehiculoResumen?.modelo || "no especificado"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {dayjs(v.fecha?.toDate?.() || v.fecha).format(
                                  "DD/MM/YYYY"
                                )}
                              </p>
                            </div>
                            <p className="font-bold text-green-700">
                              {Number(v.monto).toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS",
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No hay ingresos registrados este mes
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/70 rounded-xl shadow-sm border p-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MinusCircle className="text-red-500 w-5 h-5" />
                    Egresos
                  </h2>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {egresos.length} registros
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {egresos.length > 0 ? (
                      egresos.map((v) => (
                        <motion.div
                          key={v.id}
                          className="bg-red-50 rounded-lg p-3 border border-red-100"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">
                                {v.marca || "Producto"}{" "}
                                {v.modelo || "no especificado"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {dayjs(
                                  v.fechaIngreso?.toDate?.() || v.fechaIngreso
                                ).format("DD/MM/YYYY")}
                              </p>
                            </div>
                            <p className="font-bold text-red-700">
                              {Number(v.precioCompra || v.monto).toLocaleString(
                                "es-AR",
                                {
                                  style: "currency",
                                  currency: "ARS",
                                }
                              )}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No hay egresos registrados este mes
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
