import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, doc, updateDoc, addDoc, Timestamp } from "firebase/firestore";
import { DollarSign, User, Check, Calendar, AlertTriangle } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

export default function ListaDeudas() {
  const [deudas, setDeudas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const cargarDeudas = async () => {
      try {
        const snapshot = await getDocs(collection(db, "deudas"));
        const deudasData = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Procesar cada deuda individual en el array con validación
          const deudasProcesadas = (data.deudas || []).map(d => {
            // Validar y convertir fecha de vencimiento
            let fechaVencimiento = null;
            try {
              fechaVencimiento = d.fechaVencimiento 
                ? (d.fechaVencimiento?.toDate?.() || new Date(d.fechaVencimiento))
                : null;
            } catch (error) {
              console.error("Error procesando fecha de vencimiento:", error);
            }

            return {
              ...d,
              fechaVencimiento,
              // Validar que el monto sea un número
              monto: typeof d.monto === 'number' ? d.monto : Number(d.monto) || 0,
              // Validar estado de pago
              pagado: !!d.pagado
            };
          });
          
          // Calcular monto pendiente
          const montoPendiente = deudasProcesadas
            .filter(d => !d.pagado)
            .reduce((sum, d) => sum + d.monto, 0);

          return {
            id: doc.id,
            ...data,
            fechaVenta: data.fechaVenta?.toDate?.() || null,
            fechaCreacion: data.fechaCreacion?.toDate?.() || null,
            deudas: deudasProcesadas,
            montoPendiente,
            // Fecha de vencimiento más próxima para ordenamiento
            fechaVencimientoProxima: deudasProcesadas
              .filter(d => !d.pagado && d.fechaVencimiento)
              .reduce((min, d) => !min || d.fechaVencimiento < min ? d.fechaVencimiento : min, null)
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
        descripcion: `Pago de deuda - ${deuda.clienteNombre} (${metodoPago.metodo || 'Varios'})`,
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
        esPagoDeDeuda: true
      };

      await addDoc(collection(db, "caja_diaria"), registroCaja);
    } catch (error) {
      console.error("Error registrando en caja diaria:", error);
      throw error;
    }
  };

  const marcarComoPagado = async (deudaId, metodoPagoIndex) => {
    try {
      const deuda = deudas.find(d => d.id === deudaId);
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
        fechaPago: new Date()
      };
      
      // Verificar si todas las deudas están pagadas
      const todasPagadas = nuevosMetodosPago.every(d => d.pagado);
      
      // Calcular monto pendiente
      const montoPendiente = todasPagadas ? 0 : 
        nuevosMetodosPago
          .filter(d => !d.pagado)
          .reduce((sum, d) => sum + (Number(d.monto) || 0), 0);

      // Preparar datos para actualización
      const updateData = {
        deudas: nuevosMetodosPago,
        estado: todasPagadas ? "Pagado" : "Parcialmente Pagado",
        montoPendiente,
        ultimaActualizacion: Timestamp.now(),
        actualizadoPor: currentUser?.uid || "sistema"
      };

      if (todasPagadas) {
        updateData.fechaPago = Timestamp.now();
      }

      await updateDoc(doc(db, "deudas", deudaId), updateData);
      
      // 3. Actualizar estado en el frontend
      setDeudas(deudas.map(d => {
        if (d.id !== deudaId) return d;
        
        return {
          ...d,
          deudas: nuevosMetodosPago,
          estado: todasPagadas ? "Pagado" : "Parcialmente Pagado",
          montoPendiente,
          fechaVencimientoProxima: todasPagadas ? null : 
            nuevosMetodosPago
              .filter(d => !d.pagado && d.fechaVencimiento)
              .reduce((min, d) => !min || d.fechaVencimiento < min ? d.fechaVencimiento : min, null)
        };
      }));
      
      toast.success(todasPagadas 
        ? "Deuda completamente pagada y registrada en caja diaria"
        : "Pago parcial registrado en caja diaria");
    } catch (error) {
      console.error("Error actualizando deuda:", error);
      toast.error("Error al procesar el pago");
    }
  };

  if (cargando) return <div className="text-center py-8">Cargando deudas...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <DollarSign className="text-red-500" /> Gestión de Deudas
      </h2>
      
      {deudas.length === 0 ? (
        <p className="text-gray-500">No hay deudas registradas</p>
      ) : (
        <div className="space-y-4">
          {deudas
            .filter(d => d.estado !== "Pagado")
            .sort((a, b) => {
              // Ordenar por fecha de vencimiento más próxima
              if (a.fechaVencimientoProxima && b.fechaVencimientoProxima) {
                return a.fechaVencimientoProxima - b.fechaVencimientoProxima;
              }
              // Si una tiene fecha y otra no, la que tiene fecha va primero
              if (a.fechaVencimientoProxima) return -1;
              if (b.fechaVencimientoProxima) return 1;
              return 0;
            })
            .map(deuda => (
              <div key={deuda.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <User size={18} /> {deuda.clienteNombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Vehículo: {deuda.vehiculoInfo?.marca} {deuda.vehiculoInfo?.modelo}
                    </p>
                    <p className="text-sm text-gray-600">
                      Fecha venta: {deuda.fechaVenta?.toLocaleDateString() || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <NumericFormat
                      value={deuda.montoPendiente}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale
                      prefix="$ "
                      className="text-lg font-bold"
                    />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      deuda.estado === "Pendiente" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {deuda.estado}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <h4 className="font-medium mb-2">Detalle de pagos pendientes:</h4>
                  <ul className="space-y-3">
                    {deuda.deudas
                      .filter(d => !d.pagado)
                      .map((item, idx) => (
                        <li key={idx} className="border rounded p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">
                                {item.metodo || "Método no especificado"}
                              </span>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar size={14} />
                                {item.fechaVencimiento 
                                  ? item.fechaVencimiento.toLocaleDateString('es-AR')
                                  : "Sin fecha de vencimiento"}
                              </div>
                              {item.fechaVencimiento && item.fechaVencimiento < new Date() && (
                                <div className="flex items-center gap-1 text-red-500 text-sm">
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
                                className="font-semibold"
                              />
                              <button
                                onClick={() => marcarComoPagado(deuda.id, idx)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                              >
                                <Check size={16} />
                                Pagar
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <h4 className="font-medium mb-2">Pagos realizados:</h4>
                  {deuda.deudas.filter(d => d.pagado).length === 0 ? (
                    <p className="text-gray-400 text-sm">No hay pagos registrados</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {deuda.deudas
                        .filter(d => d.pagado)
                        .map((item, idx) => (
                          <li key={idx} className="flex justify-between text-gray-600">
                            <span>{item.metodo || "Método no especificado"}</span>
                            <div className="flex items-center gap-2">
                              <NumericFormat
                                value={item.monto}
                                displayType="text"
                                thousandSeparator="."
                                decimalSeparator=","
                                decimalScale={2}
                                fixedDecimalScale
                                prefix="$ "
                              />
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Pagado
                              </span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}