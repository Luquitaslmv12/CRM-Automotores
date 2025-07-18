import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import {
  DollarSign,
  User,
  Check,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

// Función helper para convertir posibles formatos de fecha
const convertirFecha = (fecha) => {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (fecha?.toDate) return fecha.toDate();
  if (typeof fecha === "string" || typeof fecha === "number")
    return new Date(fecha);
  return null;
};

export default function ListaDeudas() {
  const [deudas, setDeudas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [deudaExpandida, setDeudaExpandida] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const cargarDeudas = async () => {
      try {
        const snapshot = await getDocs(collection(db, "deudas"));
        const deudasData = snapshot.docs.map((doc) => {
          const data = doc.data();

          // Procesar cada deuda individual en el array con validación
          const deudasProcesadas = (data.deudas || []).map((d) => {
            return {
              ...d,
              fechaVencimiento: convertirFecha(d.fechaVencimiento),
              fechaPago: convertirFecha(d.fechaPago),
              // Validar que el monto sea un número
              monto:
                typeof d.monto === "number" ? d.monto : Number(d.monto) || 0,
              // Validar estado de pago
              pagado: !!d.pagado,
            };
          });

          // Calcular monto pendiente
          const montoPendiente = deudasProcesadas
            .filter((d) => !d.pagado)
            .reduce((sum, d) => sum + d.monto, 0);

          return {
            id: doc.id,
            ...data,
            fechaVenta: convertirFecha(data.fechaVenta),
            fechaCreacion: convertirFecha(data.fechaCreacion),
            deudas: deudasProcesadas,
            montoPendiente,
            // Fecha de vencimiento más próxima para ordenamiento
            fechaVencimientoProxima: deudasProcesadas
              .filter((d) => !d.pagado && d.fechaVencimiento)
              .reduce(
                (min, d) =>
                  !min || d.fechaVencimiento < min ? d.fechaVencimiento : min,
                null
              ),
            estado:
              montoPendiente === 0 ? "Pagado" : data.estado || "Pendiente",
          };
        });

        setDeudas(deudasData);
      } catch (error) {
        console.error("Error cargando deudas:", error);
        toast.error("Error al cargar deudas");
      } finally {
        setCargando(false);
      }
    };

    cargarDeudas();
  }, []);

  const registrarEnCajaDiaria = async (deuda, metodoPago) => {
    try {
      if (!deuda || !metodoPago) {
        throw new Error("Datos incompletos para registrar en caja diaria");
      }

      const registroCaja = {
        descripcion: `Pago de deuda - ${deuda.clienteNombre} (${
          metodoPago.metodo || "Varios"
        })`,
        monto: Number(metodoPago.monto) || 0,
        tipo: "ingreso",
        fecha: Timestamp.now(),
        relacionadoCon: `deuda:${deuda.id}`,
        ventaId: deuda.ventaId || null,
        clienteId: deuda.clienteId || null,
        vehiculoId: deuda.vehiculoId || null,
        metodoPago: metodoPago.metodo || "Varios",
        createdAt: Timestamp.now(),
        creadoPor: currentUser?.email || "Sistema",
        esPagoDeDeuda: true,
      };

      await addDoc(collection(db, "caja_diaria"), registroCaja);
    } catch (error) {
      console.error("Error registrando en caja diaria:", error);
      throw error;
    }
  };

  const marcarComoPagado = async (deudaId, metodoPagoIndex) => {
    try {
      const deuda = deudas.find((d) => d.id === deudaId);
      if (!deuda) {
        toast.error("Deuda no encontrada");
        return;
      }

      if (metodoPagoIndex < 0 || metodoPagoIndex >= deuda.deudas.length) {
        toast.error("Método de pago inválido");
        return;
      }

      const metodoPago = deuda.deudas[metodoPagoIndex];

      // 1. Registrar en caja diaria
      await registrarEnCajaDiaria(deuda, metodoPago);

      // 2. Actualizar estado de la deuda parcial
      const nuevosMetodosPago = [...deuda.deudas];
      nuevosMetodosPago[metodoPagoIndex] = {
        ...metodoPago,
        pagado: true,
        fechaPago: new Date(),
      };

      // Verificar si todas las deudas están pagadas
      const todasPagadas = nuevosMetodosPago.every((d) => d.pagado);

      // Calcular monto pendiente
      const montoPendiente = todasPagadas
        ? 0
        : nuevosMetodosPago
            .filter((d) => !d.pagado)
            .reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

      // Preparar datos para actualización
      const updateData = {
        deudas: nuevosMetodosPago,
        estado: todasPagadas ? "Pagado" : "Parcialmente Pagado",
        montoPendiente,
        ultimaActualizacion: Timestamp.now(),
        actualizadoPor: currentUser?.uid || "sistema",
      };

      if (todasPagadas) {
        updateData.fechaPago = Timestamp.now();
      }

      await updateDoc(doc(db, "deudas", deudaId), updateData);

      // 3. Actualizar estado en el frontend
      setDeudas(
        deudas.map((d) => {
          if (d.id !== deudaId) return d;

          return {
            ...d,
            deudas: nuevosMetodosPago,
            estado: todasPagadas ? "Pagado" : "Parcialmente Pagado",
            montoPendiente,
            fechaVencimientoProxima: todasPagadas
              ? null
              : nuevosMetodosPago
                  .filter((d) => !d.pagado && d.fechaVencimiento)
                  .reduce(
                    (min, d) =>
                      !min || d.fechaVencimiento < min
                        ? d.fechaVencimiento
                        : min,
                    null
                  ),
          };
        })
      );

      toast.success(
        todasPagadas
          ? "Deuda completamente pagada y registrada en caja diaria"
          : "Pago parcial registrado en caja diaria"
      );
    } catch (error) {
      console.error("Error actualizando deuda:", error);
      toast.error("Error al procesar el pago");
    }
  };

  const toggleExpandirDeuda = (deudaId) => {
    setDeudaExpandida(deudaExpandida === deudaId ? null : deudaId);
  };

  const deudasFiltradas = deudas
    .filter((deuda) => {
      // Filtro por búsqueda
      const coincideBusqueda =
        deuda.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        deuda.vehiculoInfo?.marca
          ?.toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        deuda.vehiculoInfo?.modelo
          ?.toLowerCase()
          .includes(busqueda.toLowerCase());

      // Filtro por estado
      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "pendientes" && deuda.estado !== "Pagado") ||
        (filtroEstado === "pagadas" && deuda.estado === "Pagado");

      return coincideBusqueda && coincideEstado;
    })
    .sort((a, b) => {
      // Ordenar por fecha de vencimiento más próxima
      if (a.fechaVencimientoProxima && b.fechaVencimientoProxima) {
        return a.fechaVencimientoProxima - b.fechaVencimientoProxima;
      }
      // Si una tiene fecha y otra no, la que tiene fecha va primero
      if (a.fechaVencimientoProxima) return -1;
      if (b.fechaVencimientoProxima) return 1;
      return 0;
    });

  if (cargando)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="p-6 pt-20 min-h-screen bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="text-blue-400" /> Gestión de Deudas
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente o vehículo..."
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="text-gray-400" size={18} />
              </div>
              <select
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="pendientes">Pendientes</option>
                <option value="pagadas">Pagadas</option>
              </select>
            </div>
          </div>
        </div>

        {deudasFiltradas.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">No se encontraron deudas</p>
            {busqueda || filtroEstado !== "todos" ? (
              <button
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstado("todos");
                }}
                className="mt-4 text-blue-400 hover:text-blue-300"
              >
                Limpiar filtros
              </button>
            ) : (
              <p className="text-gray-500 mt-2">No hay deudas registradas</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {deudasFiltradas.map((deuda) => (
              <div
                key={deuda.id}
                className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-200 ${
                  deudaExpandida === deuda.id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-750 transition-colors duration-150"
                  onClick={() => toggleExpandirDeuda(deuda.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold flex items-center gap-2">
                        <User size={18} className="text-blue-400" />
                        <span className="truncate max-w-xs">
                          {deuda.clienteNombre}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Vehículo: {deuda.vehiculoInfo?.marca}{" "}
                        {deuda.vehiculoInfo?.modelo}
                      </p>
                      <p className="text-sm text-gray-400">
                        Fecha venta:{" "}
                        {deuda.fechaVenta?.toLocaleDateString() || "N/A"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end ml-4">
                      <NumericFormat
                        value={deuda.montoPendiente}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$ "
                        className={`text-lg font-bold ${
                          deuda.montoPendiente > 0
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      />
                      <span
                        className={`text-xs px-2 py-1 rounded-full mt-1 ${
                          deuda.estado === "Pagado"
                            ? "bg-green-900 text-green-300"
                            : deuda.estado === "Parcialmente Pagado"
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {deuda.estado}
                      </span>
                    </div>

                    <div className="ml-4 flex items-center">
                      {deudaExpandida === deuda.id ? (
                        <ChevronUp className="text-gray-400" />
                      ) : (
                        <ChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {deudaExpandida === deuda.id && (
                  <div className="border-t border-gray-700 p-4">
                    <div className="mb-6">
                      <h4 className="font-medium mb-3 text-blue-400 flex items-center gap-2">
                        <Clock size={16} /> Pagos pendientes
                      </h4>
                      {deuda.deudas.filter((d) => !d.pagado).length === 0 ? (
                        <div className="bg-gray-750 rounded p-3 text-center text-gray-400">
                          No hay pagos pendientes
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {deuda.deudas
                            .filter((d) => !d.pagado)
                            .map((item, idx) => {
                              const fechaVencimiento = convertirFecha(
                                item.fechaVencimiento
                              );
                              return (
                                <li
                                  key={idx}
                                  className="bg-gray-750 rounded-lg p-3"
                                >
                                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-100">
                                        {item.metodo ||
                                          "Método no especificado"}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                        <Calendar size={14} />
                                        {fechaVencimiento
                                          ? fechaVencimiento.toLocaleDateString(
                                              "es-AR"
                                            )
                                          : "Sin fecha de vencimiento"}
                                      </div>
                                      {fechaVencimiento &&
                                        fechaVencimiento < new Date() && (
                                          <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                                            <AlertTriangle size={14} />
                                            ¡Vencido!
                                          </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <NumericFormat
                                        value={item.monto}
                                        displayType="text"
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        decimalScale={2}
                                        fixedDecimalScale
                                        prefix="$ "
                                        className={`font-semibold ${
                                          fechaVencimiento &&
                                          fechaVencimiento < new Date()
                                            ? "text-red-400"
                                            : "text-gray-100"
                                        }`}
                                      />
                                      <button
                                        onClick={() =>
                                          marcarComoPagado(deuda.id, idx)
                                        }
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
                                      >
                                        <Check size={16} />
                                        Pagar
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-green-400 flex items-center gap-2">
                        <Check size={16} /> Pagos realizados
                      </h4>
                      {deuda.deudas.filter((d) => d.pagado).length === 0 ? (
                        <div className="bg-gray-750 rounded p-3 text-center text-gray-400">
                          No hay pagos registrados
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {deuda.deudas
                            .filter((d) => d.pagado)
                            .map((item, idx) => {
                              const fechaPago = convertirFecha(item.fechaPago);
                              return (
                                <li
                                  key={idx}
                                  className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
                                >
                                  <div>
                                    <span className="text-gray-100">
                                      {item.metodo || "Método no especificado"}
                                    </span>
                                    {fechaPago && (
                                      <div className="text-xs text-gray-500">
                                        Pagado el:{" "}
                                        {fechaPago.toLocaleDateString("es-AR")}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <NumericFormat
                                      value={item.monto}
                                      displayType="text"
                                      thousandSeparator="."
                                      decimalSeparator=","
                                      decimalScale={2}
                                      fixedDecimalScale
                                      prefix="$ "
                                      className="text-green-400"
                                    />
                                    <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                                      Pagado
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
