import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
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
  const [pagos, setPagos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(dayjs().format("YYYY-MM"));
  const [loading, setLoading] = useState(false);

  function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Reemplazar coma por punto y eliminar otros caracteres no numéricos salvo punto
    const cleaned = value.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

  // Función para traer nombre de proveedor por ID
  const getNombreProveedor = async (idTaller) => {
  if (!idTaller) return null;
  try {
    const docRef = doc(db, "proveedores", idTaller);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().nombre; // El campo que tiene el nombre
    }
  } catch (error) {
    console.error("Error obteniendo proveedor:", error);
  }
  return null;
};


const getResumenVehiculo = async (vehiculoId) => {
  if (!vehiculoId) return null;
  try {
    const docRef = doc(db, "vehiculos", vehiculoId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return `${data.marca || "Marca"} ${data.modelo || "Modelo"} - Dominio: ${data.patente || "No especificado"}`;
    }
  } catch (error) {
    console.error("Error obteniendo vehículo:", error);
  }
  return null;
};


  useEffect(() => {
    const fetchMovimientos = async () => {
      setLoading(true);
      try {
        const [ventasSnap, comprasSnap, pagosSnap ] = await Promise.all([
          
          getDocs(collection(db, "ventas")),
          getDocs(collection(db, "compras")),
          getDocs(collection(db, "pagos")),
        ]);
        

        const mes = dayjs(mesSeleccionado);

        // Ingresos de ventas
        const ingresosFiltrados = ventasSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((v) => dayjs(v.fecha?.toDate?.() || v.fecha).isSame(mes, "month"));

        // Egresos de compras
        const egresosCompras = comprasSnap.docs
          .map((doc) => ({
            id: doc.id,
            tipo: "compra",
            ...doc.data(),
          }))
          .filter((v) =>
            dayjs(v.fecha?.toDate?.() || v.fecha).isSame(mes, "month")
          );

        // Egresos de pagos con nombre de proveedor
       const egresosPagosRaw = pagosSnap.docs
  .map((doc) => ({
    id: doc.id,
    tipo: "pago",
    ...doc.data(),
  }))
  .filter((p) =>
    dayjs(p.fecha?.toDate?.() || p.fecha).isSame(mes, "month")
  );

// Ahora obtenemos el nombre del proveedor para cada pago:
const egresosPagos = await Promise.all(
  egresosPagosRaw.map(async (pago) => {
    const nombreProveedor = await getNombreProveedor(pago.tallerId);
    const resumenVehiculo = await getResumenVehiculo(pago.vehiculoId);
    return {
      ...pago,
      nombreProveedor,
      resumenVehiculo,
    };
  })
);

        // Filtrar egresosPagos por mes
        const egresosPagosFiltrados = egresosPagos.filter((p) =>
          dayjs(p.fecha?.toDate?.() || p.fecha).isSame(mes, "month")
        );

        // Unir egresos
        const todosLosEgresos = [...egresosCompras, ...egresosPagosFiltrados];

        setIngresos(ingresosFiltrados);
        setEgresos(todosLosEgresos);
        setPagos(egresosPagosFiltrados); // opcional
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, [mesSeleccionado]);

  const totalIngresos = ingresos.reduce(
  (acc, v) => acc + parseNumber(v.monto),
  0
);

const egresosCompras = egresos.filter(e => e.tipo === "compra");
const egresosPagos = egresos.filter(e => e.tipo === "pago");

const totalCompras = egresosCompras.reduce(
  (acc, e) => acc + parseNumber(e.monto ?? e.precioCompra ?? 0),
  0
);

const totalPagos = egresosPagos.reduce(
  (acc, e) => acc + parseNumber(e.monto ?? 0),
  0
);

const totalEgresos = egresos.reduce((acc, e) => acc + parseNumber(e.monto), 0);

const saldo = totalIngresos - totalEgresos;

  // Formatear fecha para mostrar
  const mesMostrado = dayjs(mesSeleccionado).locale("es").format("MMMM YYYY");

  console.log("Ingresos:", totalIngresos);
console.log("Egresos total:", totalEgresos);

console.log("Saldo:", saldo);

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
                      <p className="text-sm text-gray-600 font-medium">Ingresos</p>
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
                      <p className="text-sm text-gray-600 font-medium">Egresos</p>
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
                      <p className="text-sm text-gray-600 font-medium">Saldo neto</p>
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
                          className={`${
                            v.tipo === "pago"
                              ? "bg-yellow-100 border-yellow-200"
                              : "bg-red-50 border-red-100"
                          } rounded-lg p-3 border`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                           <p className="text-gray-800">
  {v.tipo === "pago" ? (
    <>
      <span className="font-semibold text-red-700">Pago a proveedor:</span>{" "}
      <span className="font-medium text-blue-700">{v.nombreProveedor || "Sin nombre"}</span>{" "}
      <span>por vehículo </span>
      <span className="font-semibold text-green-700">{v.resumenVehiculo || "No especificado"}</span>{" "}
      {v.dominio && (
        <span className="text-gray-500">- Dominio: {v.dominio}</span>
      )}
    </>
  ) : (
    <>
      <span className="font-semibold">{v.marca || "Producto"}</span>{" "}
      <span>{v.modelo || ""}</span>
    </>
  )}
</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {dayjs(v.fecha?.toDate?.() || v.fecha).format(
                                  "DD/MM/YYYY"
                                )}
                              </p>
                            </div>
                            <p className="font-bold text-red-700">
                              {Number(v.monto || v.precioCompra).toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS",
                              })}
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