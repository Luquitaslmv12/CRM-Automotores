import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";
import {
  PlusCircle,
  Trash,
  Edit,
  Save,
  Download,
  Filter,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Printer,
  Search,
  Type,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Toaster, toast } from "react-hot-toast";
import { NumericFormat } from "react-number-format";
import ModalResumenSaldo from "../components/caja/ModalResumenSaldo";



export default function CajaDiaria() {
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"));
  const [movimientos, setMovimientos] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("ingreso");
  const [editando, setEditando] = useState(null);
  const [verTodo, setVerTodo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [filtroDescripcion, setFiltroDescripcion] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [showFiltros, setShowFiltros] = useState(false);
  const [saldoAcumulado, setSaldoAcumulado] = useState(0);
  const [orden, setOrden] = useState({ campo: "fecha", direccion: "desc" });
  const [showCopied, setShowCopied] = useState(false);
  const [busquedaRapida, setBusquedaRapida] = useState("");
  const descripcionRef = useRef(null);
  const [formaDePago, setFormaDePago] = useState("efectivo");

  const [mostrarResumenPagos, setMostrarResumenPagos] = useState(false);

      const formatPesos = (value) => {
    const number = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return number.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };




  const cambiarMes = (meses) => {
    setFecha(dayjs(fecha).add(meses, 'month').format("YYYY-MM-DD"));
  };

  const [verMesCompleto, setVerMesCompleto] = useState(false);
  const [movimientosMensuales, setMovimientosMensuales] = useState([]);
  const [resumenMensual, setResumenMensual] = useState({
    ingresos: 0,
    egresos: 0,
    saldo: 0
  });

  const cargarMovimientosMensuales = async () => {
    setCargando(true);
    try {
      const inicioMes = Timestamp.fromDate(dayjs(fecha).startOf('month').toDate());
      const finMes = Timestamp.fromDate(dayjs(fecha).endOf('month').toDate());

      const q = query(
        collection(db, "caja_diaria"),
        where("fecha", ">=", inicioMes),
        where("fecha", "<=", finMes),
        orderBy("fecha", "asc")
      );

      const snapshot = await getDocs(q);
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fechaFormateada: dayjs(doc.data().fecha?.toDate?.() || doc.data().fecha).format("YYYY-MM-DD")
      }));

      const agrupadosPorDia = datos.reduce((acc, movimiento) => {
        const fecha = movimiento.fechaFormateada;
        if (!acc[fecha]) {
          acc[fecha] = {
            fecha,
            movimientos: [],
            ingresos: 0,
            egresos: 0
          };
        }
        
        acc[fecha].movimientos.push(movimiento);
        
        if (movimiento.tipo === "ingreso") {
          acc[fecha].ingresos += parseFloat(movimiento.monto);
        } else {
          acc[fecha].egresos += parseFloat(movimiento.monto);
        }
        
        return acc;
      }, {});

      const resumen = Object.values(agrupadosPorDia).reduce((acc, dia) => {
        acc.ingresos += dia.ingresos;
        acc.egresos += dia.egresos;
        acc.saldo += (dia.ingresos - dia.egresos);
        return acc;
      }, { ingresos: 0, egresos: 0, saldo: 0 });

      setMovimientosMensuales(Object.values(agrupadosPorDia));
      setResumenMensual(resumen);
    } catch (error) {
      console.error("Error cargando movimientos mensuales:", error);
      toast.error("Error al cargar movimientos mensuales");
    } finally {
      setCargando(false);
    }
  };

  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      let q;
      if (verTodo) {
        q = query(
          collection(db, "caja_diaria"), 
          orderBy(orden.campo, orden.direccion)
        );
      } else {
        const inicio = Timestamp.fromDate(new Date(`${fecha}T00:00:00`));
        const fin = Timestamp.fromDate(new Date(`${fecha}T23:59:59.999`));

        q = query(
          collection(db, "caja_diaria"),
          where("fecha", ">=", inicio),
          where("fecha", "<=", fin),
          orderBy(orden.campo, orden.direccion)
        );
      }

      const snapshot = await getDocs(q);
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMovimientos(datos);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
      toast.error("Error al cargar movimientos");
    } finally {
      setCargando(false);
    }
  };

  const calcularSaldoAcumulado = async () => {
    try {
      const hasta = Timestamp.fromDate(
        new Date(new Date(fecha).setHours(23, 59, 59, 999))
      );
      const q = query(
        collection(db, "caja_diaria"),
        where("fecha", "<=", hasta),
        orderBy("fecha", "asc")
      );
      const snapshot = await getDocs(q);
      const datos = snapshot.docs.map((doc) => doc.data());

      let saldo = 0;
      
      datos.forEach(m => {
        if (m.tipo === "ingreso") {
          saldo += parseFloat(m.monto);
        } else {
          saldo -= parseFloat(m.monto);
        }
      });

      setSaldoAcumulado(saldo);
    } catch (error) {
      console.error("Error calculando saldo acumulado:", error);
      toast.error("Error al calcular saldo acumulado");
    }
  };

  useEffect(() => {
    if (verMesCompleto) {
      cargarMovimientosMensuales();
    } else if (verTodo) {
      cargarMovimientos();
    } else {
      cargarMovimientos();
      calcularSaldoAcumulado();
    }
  }, [fecha, verTodo, verMesCompleto, orden]);

  useEffect(() => {
    if (editando === null && descripcionRef.current) {
      descripcionRef.current.focus();
    }
  }, [editando]);

  const handleAgregarMovimiento = async () => {
    if (!descripcion.trim()) {
      toast.error("La descripción es requerida");
      descripcionRef.current.focus();
      return;
    }
    
    if (!monto || parseFloat(monto) <= 0) {
      toast.error("El monto debe ser mayor a cero");
      return;
    }

    try {
      await addDoc(collection(db, "caja_diaria"), {
        descripcion: descripcion.trim(),
        monto: parseFloat(monto),
        tipo,
         formaDePago,
        fecha: Timestamp.fromDate(dayjs(fecha).hour(12).toDate()),
        createdAt: Timestamp.now(),
      });
      setDescripcion("");
      setMonto("");
      setTipo("ingreso");
      toast.success("Movimiento agregado correctamente");
      cargarMovimientos();
      if (!verTodo) {
        calcularSaldoAcumulado();
      }
    } catch (error) {
      console.error("Error agregando movimiento:", error);
      toast.error("Error al agregar movimiento");
    }
  };

  const handleEliminar = async (id) => {
    toast.custom((t) => (
      <div className="bg-slate-800 p-4 rounded-lg shadow-lg border border-indigo-700">
        <p className="font-medium mb-3 text-slate-100">¿Estás seguro de eliminar este movimiento?</p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
          >
            Cancelar
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t);
              try {
                await deleteDoc(doc(db, "caja_diaria", id));
                setMovimientos((prev) => prev.filter((m) => m.id !== id));
                if (!verTodo) {
                  calcularSaldoAcumulado();
                }
                toast.success("Movimiento eliminado");
              } catch (error) {
                console.error("Error eliminando movimiento:", error);
                toast.error("Error al eliminar movimiento");
              }
            }}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </button>
        </div>
      </div>
    ));
  };

  const handleGuardarEdicion = async (id, nuevo) => {
    if (!nuevo.descripcion.trim()) {
      toast.error("La descripción no puede estar vacía");
      return;
    }
    
    if (!nuevo.monto || parseFloat(nuevo.monto) <= 0) {
      toast.error("El monto debe ser mayor a cero");
      return;
    }

    try {
      await updateDoc(doc(db, "caja_diaria", id), {
        ...nuevo,
        formaDePago: nuevo.formaDePago,
        descripcion: nuevo.descripcion.trim(),
        updatedAt: Timestamp.now(),
      });
      setEditando(null);
      toast.success("Movimiento actualizado");
      cargarMovimientos();
      if (!verTodo) {
        calcularSaldoAcumulado();
      }
    } catch (error) {
      console.error("Error actualizando movimiento:", error);
      toast.error("Error al actualizar movimiento");
    }
  };

  const exportarExcel = () => {
    let data, nombreArchivo;
    
    if (verMesCompleto) {
      data = movimientosMensuales.flatMap(dia => 
        dia.movimientos.map(m => ({
          Fecha: dayjs(m.fecha?.toDate?.() || m.fecha).format("YYYY-MM-DD HH:mm"),
          Día: formatoFecha(m.fecha?.toDate?.() || m.fecha),
          Descripción: m.descripcion,
          Tipo: m.tipo === "ingreso" ? "Ingreso" : "Egreso",
          Monto: m.tipo === "ingreso" ? m.monto : -m.monto,
          'Monto Absoluto': m.monto
        }))
      );
      
      nombreArchivo = `CajaMensual_${dayjs(fecha).format("YYYYMM")}`;
    } else {
      data = movimientosFiltrados.map((m) => ({
        Fecha: dayjs(m.fecha?.toDate?.() || m.fecha).format("YYYY-MM-DD HH:mm"),
        Descripción: m.descripcion,
        Tipo: m.tipo === "ingreso" ? "Ingreso" : "Egreso",
        'Forma de Pago': m.formaDePago,
        Monto: m.tipo === "ingreso" ? m.monto : -m.monto,
        'Monto Absoluto': m.monto,
        'Fecha Creación': m.createdAt ? dayjs(m.createdAt.toDate()).format("YYYY-MM-DD HH:mm") : '-',
        'Última Actualización': m.updatedAt ? dayjs(m.updatedAt.toDate()).format("YYYY-MM-DD HH:mm") : '-'
      }));
      
      nombreArchivo = verTodo 
        ? `CajaCompleta_${dayjs().format("YYYYMMDD_HHmmss")}`
        : `CajaDiaria_${dayjs(fecha).format("YYYYMMDD")}`;
    }

    const hoja = XLSX.utils.json_to_sheet(data);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");

    const resumen = verMesCompleto
      ? [
          ["MES", dayjs(fecha).format("MMMM YYYY")],
          ["TOTAL INGRESOS", resumenMensual.ingresos],
          ["TOTAL EGRESOS", resumenMensual.egresos],
          ["SALDO MENSUAL", resumenMensual.saldo],
          ["DÍAS CON MOVIMIENTOS", movimientosMensuales.length],
          ["FECHA REPORTE", dayjs().format("YYYY-MM-DD HH:mm:ss")]
        ]
      : [
          ["TOTAL INGRESOS", totalIngresos],
          ["TOTAL EGRESOS", totalEgresos],
          ["SALDO", saldo],
          ["SALDO ACUMULADO", saldoAcumulado],
          ["CANTIDAD DE MOVIMIENTOS", movimientosFiltrados.length],
          ["FECHA REPORTE", dayjs().format("YYYY-MM-DD HH:mm:ss")],
        ];
    
    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(resumen), "Resumen");

    const excelBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    const archivo = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(archivo, `${nombreArchivo}.xlsx`);
    toast.success("Reporte exportado a Excel");
  };

  const copiarResumen = () => {
    let resumen;
    
    if (verMesCompleto) {
      resumen = `Resumen Mensual - ${dayjs(fecha).format("MMMM YYYY")}
      
Total Ingresos: ${formatPesos(resumenMensual.ingresos)}
Total Egresos: ${formatPesos(resumenMensual.egresos)}
Saldo Mensual: ${formatPesos(resumenMensual.saldo)}
Días con movimientos: ${movimientosMensuales.length}`;
    } else {
      resumen = `Resumen Caja ${verTodo ? "Completa" : "Diaria"} - ${dayjs(fecha).format("DD/MM/YYYY")}
      
Total Ingresos: ${formatPesos(totalIngresos)}
Total Egresos: ${formatPesos(totalEgresos)}
Saldo: ${formatPesos(saldo)}
${!verTodo ? `Saldo Acumulado: ${formatPesos(saldoAcumulado)}\n` : ''}
Movimientos: ${movimientosFiltrados.length}`;
    }

    navigator.clipboard.writeText(resumen);
    toast.success("Resumen copiado al portapapeles");
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const movimientosFiltrados = movimientos.filter((m) => {
    const desc = m.descripcion.toLowerCase().includes(filtroDescripcion.toLowerCase());
    const tipoOK = filtroTipo === "todos" || m.tipo === filtroTipo;
    const busquedaOK = busquedaRapida 
      ? m.descripcion.toLowerCase().includes(busquedaRapida.toLowerCase()) || 
        m.monto.toString().includes(busquedaRapida)
      : true;
    return desc && tipoOK && busquedaOK;
  });

  const totalIngresos = movimientosFiltrados
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + parseFloat(m.monto), 0);

  const totalEgresos = movimientosFiltrados
    .filter((m) => m.tipo === "egreso")
    .reduce((acc, m) => acc + parseFloat(m.monto), 0);

  const saldo = totalIngresos - totalEgresos;

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (editando !== null) {
        const m = movimientos.find((x) => x.id === editando);
        if (m) handleGuardarEdicion(editando, m);
      } else {
        handleAgregarMovimiento();
      }
    }

    if (e.ctrlKey && e.key === "ArrowLeft") {
      setFecha(dayjs(fecha).subtract(1, "day").format("YYYY-MM-DD"));
    }
    if (e.ctrlKey && e.key === "ArrowRight") {
      setFecha(dayjs(fecha).add(1, "day").format("YYYY-MM-DD"));
    }
    if (e.ctrlKey && e.key === "h") {
      setVerTodo((prev) => !prev);
    }
    if (e.ctrlKey && e.key === "f") {
      setShowFiltros((prev) => !prev);
    }
    if (e.ctrlKey && e.key === "e") {
      exportarExcel();
    }
  };

  const ordenarPor = (campo) => {
    if (orden.campo === campo) {
      setOrden({
        campo,
        direccion: orden.direccion === "asc" ? "desc" : "asc",
      });
    } else {
      setOrden({ campo, direccion: "asc" });
    }
  };

  const formatoFecha = (fecha) => {
    const hoy = dayjs().format("YYYY-MM-DD");
    const ayer = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    const fechaMov = dayjs(fecha?.toDate?.() || fecha).format("YYYY-MM-DD");
    
    if (fechaMov === hoy) return "Hoy";
    if (fechaMov === ayer) return "Ayer";
    return dayjs(fecha?.toDate?.() || fecha).format("DD/MM/YYYY");
  };

  const cambiarFecha = (dias) => {
    setFecha(dayjs(fecha).add(dias, "day").format("YYYY-MM-DD"));
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-800 text-slate-100">
      <Toaster position="bottom-right" />
      <div
        className="max-w-7xl mx-auto  bg-gradient-to-br from-slate-700 via-slate-800 to-slate-600 rounded-xl shadow-2xl border border-indigo-700 overflow-hidden"
        onKeyDown={handleKeyPress}
        tabIndex={0}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 p-6 text-white border-b border-indigo-600">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Gestión de Caja Diaria</h1>
              <p className="text-indigo-200">
                {verTodo 
                  ? "Viendo todo el historial" 
                  : verMesCompleto
                    ? `Viendo movimientos de ${dayjs(fecha).format("MMMM YYYY")}`
                    : `Viendo movimientos del ${dayjs(fecha).format("DD/MM/YYYY")}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => verMesCompleto ? cargarMovimientosMensuales() : cargarMovimientos()}
                className="p-2 rounded-full hover:bg-indigo-600 transition-colors cursor-pointer"
                title="Recargar"
              >
                <RefreshCw className={`w-5 h-5 ${cargando ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 rounded-full hover:bg-indigo-600 transition-colors cursor-pointer"
                title="Imprimir"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Controles principales */}
        <div className="p-6 border-b border-indigo-700">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    
    {/* Navegación por fecha */}
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300">Fecha de búsqueda:</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => cambiarFecha(-1)}
          disabled={verTodo || verMesCompleto}
          title="Día anterior"
          className="p-2 bg-slate-500 hover:bg-slate-600 cursor-pointer rounded-md text-slate-200 disabled:opacity-30 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="flex-1 appearance-none bg-slate-800 text-slate-100 border border-indigo-600 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 text-center"
          disabled={verTodo || verMesCompleto}
        />

        <button
          onClick={() => cambiarFecha(1)}
          disabled={verTodo || verMesCompleto}
          title="Día siguiente"
          className="p-2 bg-slate-500 hover:bg-slate-600 cursor-pointer rounded-md text-slate-200 disabled:opacity-30 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>

    {/* Botón: Ver todo */}
    <div className="flex items-end">
      <button
        onClick={() => {
          setVerTodo((prev) => !prev);
          setVerMesCompleto(false);
        }}
        className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 transition ${
          verTodo
            ? "bg-indigo-900 text-indigo-200 hover:bg-indigo-800"
            : "bg-indigo-700 text-white hover:bg-indigo-600"
        }`}
      >
        {verTodo ? (
          <>
            <X className="w-4 h-4" />
            <span>Filtrar por fecha</span>
          </>
        ) : (
          <>
            <Filter className="w-4 h-4" />
            <span>Ver todo el historial</span>
          </>
        )}
      </button>
    </div>
  

            
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-1">Búsqueda rápida:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar en descripción o monto"
                  value={busquedaRapida}
                  onChange={(e) => setBusquedaRapida(e.target.value)}
                  className="w-full bg-slate-700 text-slate-100 border border-indigo-600 p-2 pl-10 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-indigo-300" />
              </div>
            </div>
          </div>

          {/* Formulario de movimiento */}
          {!verMesCompleto && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900/80 to-slate-900 backdrop-blur-lg p-4 rounded-lg mb-4 border border-indigo-600">
              <h3 className="text-lg font-medium text-indigo-300 mb-3 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-green-500" />
                Nuevo Movimiento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Type className="w-4 h-4 text-indigo-400" />
                    Descripción:
                  </label>
                  <input
                    ref={descripcionRef}
                    type="text"
                    placeholder="Ej: Venta de productos"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-slate-800 text-slate-100 border border-indigo-600 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                  <div>
      <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
        <DollarSign className="w-4 h-4 text-indigo-400" />
        Monto:
      </label>
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
        <NumericFormat
  value={monto}
  onValueChange={({ floatValue }) => setMonto(floatValue?.toString() || "")}
  thousandSeparator="."
  decimalSeparator=","
  decimalScale={2}
  fixedDecimalScale
  allowNegative={false}
  prefix="$ "
  placeholder="0,00"
  className="w-full bg-slate-800 text-slate-100 border border-indigo-600 p-2 pl-8 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
/>

      </div>
    </div>

    <div>
  <label className="block text-sm font-medium text-slate-300 mb-1">
    Forma:
  </label>
  <select
    value={formaDePago}
    onChange={(e) => setFormaDePago(e.target.value)}
    className="w-full bg-slate-800 text-slate-100 border border-indigo-600 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
  >
    <option value="efectivo">Efectivo</option>
    <option value="transferencia">Transferencia</option>
    <option value="tarjeta">Tarjeta</option>
    <option value="cheque">Cheque</option>
    <option value="otro">Otro</option>
  </select>
</div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Tipo:
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTipo("ingreso")}
                      className={`flex-1 py-2 px-3 rounded-md font-medium flex items-center justify-center gap-2 ${
                        tipo === "ingreso" 
                          ? "bg-green-700 text-white hover:bg-green-600" 
                          : "bg-green-900/50 text-green-300 hover:bg-green-800/50"
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                      Ingreso
                    </button>
                    <button
                      onClick={() => setTipo("egreso")}
                      className={`flex-1 py-2 px-3 rounded-md font-medium flex items-center justify-center gap-2 ${
                        tipo === "egreso" 
                          ? "bg-red-700 text-white hover:bg-red-600" 
                          : "bg-red-900/50 text-red-300 hover:bg-red-800/50"
                      }`}
                    >
                      <ArrowDown className="w-4 h-4" />
                      Egreso
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAgregarMovimiento}
                disabled={!descripcion || !monto}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle className="w-5 h-5" />
                Agregar Movimiento
              </button>
            </div>
          )}
        </div>

        {/* Controles secundarios */}
        <div className="p-6 border-b border-indigo-700">
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${
                showFiltros 
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-200" 
                  : "bg-indigo-900 hover:bg-indigo-800 text-indigo-200"
              }`}
            >
              {showFiltros ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              Filtros Avanzados
            </button>

            <button
              onClick={exportarExcel}
              className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exportar Excel
            </button>

            <button
              onClick={copiarResumen}
              className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copiar Resumen
            </button>

            <button
              onClick={() => {
                setVerMesCompleto(!verMesCompleto);
                setVerTodo(false);
              }}
              className={`ml-auto px-4 py-2 rounded-md font-medium flex items-center gap-2 ${
                verMesCompleto 
                  ? "bg-amber-700 hover:bg-amber-600 text-white" 
                  : "bg-amber-800 hover:bg-amber-700 text-white"
              }`}
            >
              <Calendar className="w-5 h-5" />
              {verMesCompleto ? "Ver día actual" : "Ver mes completo"}
            </button>
          </div>

          {showFiltros && (
            <div className="bg-slate-700 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 border border-indigo-600">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Buscar en descripción:
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por descripción"
                  value={filtroDescripcion}
                  onChange={(e) => setFiltroDescripcion(e.target.value)}
                  className="w-full bg-slate-800 text-slate-100 border border-indigo-600 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Filtrar por tipo:
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full bg-slate-800 text-slate-100 border border-indigo-600 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="todos">Todos los movimientos</option>
                  <option value="ingreso">Solo ingresos</option>
                  <option value="egreso">Solo egresos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Ordenar por:
                </label>
                <select
                  value={`${orden.campo}_${orden.direccion}`}
                  onChange={(e) => {
                    const [campo, direccion] = e.target.value.split("_");
                    setOrden({ campo, direccion });
                  }}
                  className="w-full bg-slate-800 text-slate-100 border border-indigo-600 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="fecha_desc">Fecha (más reciente primero)</option>
                  <option value="fecha_asc">Fecha (más antiguo primero)</option>
                  <option value="descripcion_asc">Descripción (A-Z)</option>
                  <option value="descripcion_desc">Descripción (Z-A)</option>
                  <option value="monto_desc">Monto (mayor primero)</option>
                  <option value="monto_asc">Monto (menor primero)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lista de movimientos */}
        <div className="p-6">
          {cargando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : verMesCompleto ? (
            /* Vista mensual */
            <>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => cambiarMes(-1)}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Mes anterior
                </button>
                
                <h2 className="text-xl font-bold text-slate-200">
                  {dayjs(fecha).format("MMMM YYYY")}
                </h2>
                
                <button
                  onClick={() => cambiarMes(1)}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200"
                >
                  Mes siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-6 bg-slate-700 p-4 rounded-lg border border-indigo-600">
                <h3 className="text-xl font-bold text-indigo-200 mb-3">Resumen Mensual</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-900/30 p-4 rounded-lg border border-green-700/50">
                    <p className="text-sm text-green-300 font-medium">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-200">
                      {formatPesos(resumenMensual.ingresos)}
                    </p>
                  </div>
                  <div className="bg-red-900/30 p-4 rounded-lg border border-red-700/50">
                    <p className="text-sm text-red-300 font-medium">Total Egresos</p>
                    <p className="text-2xl font-bold text-red-200">
                      {formatPesos(resumenMensual.egresos)}
                    </p>
                  </div>
                  <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-700/50">
                    <p className="text-sm text-indigo-300 font-medium">Saldo Mensual</p>
                    <p className="text-2xl font-bold text-indigo-200">
                      {formatPesos(resumenMensual.saldo)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-indigo-300">
                  <p>Mes: {dayjs(fecha).format("MMMM YYYY")}</p>
                  <p>Días con movimientos: {movimientosMensuales.length}</p>
                </div>
              </div>

              {movimientosMensuales.length === 0 ? (
                <div className="text-center py-8 bg-slate-700 rounded-lg border border-indigo-600">
                  <p className="text-slate-400">No hay movimientos en este mes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {movimientosMensuales.map((dia) => (
                    <div key={dia.fecha} className="border border-indigo-600 rounded-lg overflow-hidden">
                      <div className="bg-slate-700 p-3 border-b border-indigo-600 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-slate-200">
                            {formatoFecha(dia.fecha)}
                          </span>
                          <span className="ml-2 text-sm text-slate-400">
                            ({dia.movimientos.length} movimientos)
                          </span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-green-400 font-medium">
                            +{formatPesos(dia.ingresos)}
                          </span>
                          <span className="text-red-400 font-medium">
                            -{formatPesos(dia.egresos)}
                          </span>
                          <span className="font-medium text-slate-200">
                            Saldo: {formatPesos(dia.ingresos - dia.egresos)}
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-indigo-600">
                        {dia.movimientos.map((movimiento) => (
                          <div key={movimiento.id} className="p-3 hover:bg-slate-700/50 flex justify-between">
                            <div>
                              <p className="font-medium text-slate-200">{movimiento.descripcion}</p>
                              <p className="text-sm text-slate-400">
                                {dayjs(movimiento.fecha?.toDate?.() || movimiento.fecha).format("HH:mm")}
                                <p className="capitalize">• {movimiento.formaDePago}</p>
                              </p>
                            </div>
                            <div className={`font-medium ${
                              movimiento.tipo === "ingreso" ? "text-green-400" : "text-red-400"
                            }`}>
                              {movimiento.tipo === "ingreso" ? "+" : "-"}
                              {formatPesos(parseFloat(movimiento.monto))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : movimientosFiltrados.length === 0 ? (
            /* Vista vacía (sin resultados) */
            <div className="text-center py-8 bg-slate-700 rounded-lg border border-indigo-600">
              <p className="text-slate-400">
                {filtroDescripcion || filtroTipo !== "todos" || busquedaRapida 
                  ? "No hay movimientos que coincidan con los filtros aplicados" 
                  : verTodo 
                    ? "No hay movimientos registrados" 
                    : "No hay movimientos para esta fecha"}
              </p>
            </div>
          ) : (
            /* Vista diaria (tabla) */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-indigo-600">
                <thead className="bg-slate-700">
                  <tr>
                    <th 
                      className="px-2 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600"
                      onClick={() => ordenarPor("fecha")}
                    >
                      <div className="flex items-center gap-1">
                        Fecha
                        {orden.campo === "fecha" && (
                          orden.direccion === "asc" 
                            ? <ArrowUp className="w-3 h-3" /> 
                            : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600"
                      onClick={() => ordenarPor("descripcion")}
                    >
                      <div className="flex items-center gap-1">
                        Descripción
                        {orden.campo === "descripcion" && (
                          orden.direccion === "asc" 
                            ? <ArrowUp className="w-3 h-3" /> 
                            : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                        Forma
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600"
                      onClick={() => ordenarPor("monto")}
                    >
                      <div className="flex items-center gap-1">
                        Monto
                        {orden.campo === "monto" && (
                          orden.direccion === "asc" 
                            ? <ArrowUp className="w-3 h-3" /> 
                            : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-indigo-600">
                  {movimientosFiltrados.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatoFecha(m.fecha?.toDate?.() || m.fecha)}
                        <div className="text-xs text-slate-500">
                          {dayjs(m.fecha?.toDate?.() || m.fecha).format("HH:mm")}
                        </div>
                      </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
  {editando === m.id ? (
    <input
      value={m.descripcion}
      onChange={(e) =>
        setMovimientos((prev) =>
          prev.map((x) =>
            x.id === m.id ? { ...x, descripcion: e.target.value } : x
          )
        )
      }
      className="bg-slate-700 text-slate-200 border border-indigo-600 p-1 rounded w-full focus:ring-2 focus:ring-indigo-500"
      onKeyPress={handleKeyPress}
      autoFocus
    />
  ) : (
    <div>
      {m.descripcion}
      {m.formaDePago === "Cheque" && m.detallesCheque && (
        <div className="text-xs text-indigo-300 mt-1">
          <p>Cheque #{m.detallesCheque.numero} - {m.detallesCheque.emisor}</p>
          <p>Emisión: {dayjs(m.detallesCheque.fechaEmision).format("DD/MM/YYYY")} - 
             Vencimiento: {dayjs(m.detallesCheque.fechaVencimiento).format("DD/MM/YYYY")}</p>
        </div>
      )}
    </div>
  )}
</td>

                      <td className="px-2 py-4 whitespace-nowrap text-md text-slate-300">
  {editando === m.id ? (
    <select
      value={m.formaDePago}
      onChange={(e) =>
        setMovimientos((prev) =>
          prev.map((x) =>
            x.id === m.id ? { ...x, formaDePago: e.target.value } : x
          )
        )
      }
      className="bg-slate-700 text-slate-200 border border-indigo-600 p-1 rounded focus:ring-2 focus:ring-indigo-500"
    >
      <option value="efectivo">Efectivo</option>
      <option value="transferencia">Transferencia</option>
      <option value="tarjeta">Tarjeta</option>
      <option value="cheque">Cheque</option>
      <option value="otro">Otro</option>
    </select>
  ) : (
    <span className="capitalize">{m.formaDePago}</span>
  )}
</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {editando === m.id ? (
                          <select
                            value={m.tipo}
                            onChange={(e) =>
                              setMovimientos((prev) =>
                                prev.map((x) =>
                                  x.id === m.id ? { ...x, tipo: e.target.value } : x
                                )
                              )
                            }
                            className="bg-slate-700 text-slate-200 border border-indigo-600 p-1 rounded focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="ingreso">Ingreso</option>
                            <option value="egreso">Egreso</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            m.tipo === "ingreso" ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"
                          }`}>
                            {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {editando === m.id ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1.5 text-slate-400">$</span>
                            <NumericFormat
  value={monto}
  onValueChange={({ floatValue }) => setMonto(floatValue?.toString() || "")}
  thousandSeparator="."
  decimalSeparator=","
  decimalScale={2}
  fixedDecimalScale
  allowNegative={false}
  prefix="$ "
  placeholder="0,00"
  className="w-full bg-slate-800 text-slate-100 border border-indigo-600 p-2 pl-8 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
/>
                          </div>
                        ) : (
                          <span className={`font-medium ${
                            m.tipo === "ingreso" ? "text-green-400" : "text-red-400"
                          }`}>
                            {m.tipo === "ingreso" ? "+" : "-"}{" "}
                            {formatPesos(parseFloat(m.monto))}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        <div className="flex gap-2">
                          {editando === m.id ? (
                            <>
                              <button
                                onClick={() => handleGuardarEdicion(m.id, m)}
                                className="text-green-500 hover:text-green-400 p-1 rounded hover:bg-slate-700"
                                title="Guardar"
                              >
                                <Save className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditando(null)}
                                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700"
                                title="Cancelar"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEditando(m.id)}
                              className="text-indigo-400 hover:text-indigo-300 p-1 rounded hover:bg-slate-700"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEliminar(m.id)}
                            className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-slate-700"
                            title="Eliminar"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Resumen */}
        <div className="p-4 rounded-lg space-y-4 bg-slate-800 border-t border-indigo-700">
          <h2 className="text-lg font-semibold text-slate-200">
            Resumen {verTodo ? "General" : verMesCompleto ? "Mensual" : "Diario"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarjeta de Ingresos */}
            <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 p-4 rounded-lg border border-green-700/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-1">
                <div className="p-1.5 rounded-full bg-green-900/50">
                  <ArrowUp className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-sm font-medium text-green-300">Total Ingresos</h3>
              </div>
              <p className="text-2xl font-bold text-green-200">
                {verMesCompleto ? formatPesos(resumenMensual.ingresos) : formatPesos(totalIngresos)}
              </p>
              
            </div>
            
            {/* Tarjeta de Egresos */}
            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 p-4 rounded-lg border border-red-700/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-1">
                <div className="p-1.5 rounded-full bg-red-900/50">
                  <ArrowDown className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-sm font-medium text-red-300">Total Egresos</h3>
              </div>
              <p className="text-2xl font-bold text-red-200">
                {verMesCompleto ? formatPesos(resumenMensual.egresos) : formatPesos(totalEgresos)}
              </p>
             
            </div>
            
            {/* Tarjeta de Saldo */}
            <div className={`bg-gradient-to-br p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
              (verMesCompleto ? resumenMensual.saldo : saldo) >= 0 
                ? "from-indigo-900/30 to-indigo-900/10 border-indigo-700/50" 
                : "from-amber-900/30 to-amber-900/10 border-amber-700/50"
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                <div className={`p-1.5 rounded-full ${
                  (verMesCompleto ? resumenMensual.saldo : saldo) >= 0 ? "bg-indigo-900/50" : "bg-amber-900/50"
                }`}>
                  <DollarSign className={`w-4 h-4 ${
                    (verMesCompleto ? resumenMensual.saldo : saldo) >= 0 ? "text-indigo-400" : "text-amber-400"
                  }`} />
                </div>
                <h3 className={`text-sm font-medium ${
                  (verMesCompleto ? resumenMensual.saldo : saldo) >= 0 ? "text-indigo-300" : "text-amber-300"
                }`}>
                  Saldo {verTodo ? "General" : verMesCompleto ? "Mensual" : "Diario"}
                </h3>
              </div>
              <p className={`text-2xl font-bold ${
                (verMesCompleto ? resumenMensual.saldo : saldo) >= 0 ? "text-indigo-200" : "text-amber-200"
              }`}>
                {verMesCompleto ? formatPesos(resumenMensual.saldo) : formatPesos(saldo)}
              </p>
              {!verTodo && !verMesCompleto && (
                <p className={`text-xs mt-1 ${
                  saldo >= 0 ? "text-indigo-400" : "text-amber-400"
                }`}>
                  {saldo >= 0 ? "↑ Favorable" : "↓ Atención requerida"}
                </p>
              )}
            </div>
          </div>

          {!verMesCompleto && !verTodo && (
  <div className="mt-4 flex flex-col sm:flex-row gap-4">
    <div className="bg-slate-700/50 p-3 rounded-lg border border-indigo-600/50 flex-1">
      <p className="text-sm font-medium text-slate-300">
        Saldo Acumulado: <span className="font-bold">{formatPesos(saldoAcumulado)}</span>
      </p>
    </div>
    
    <button
      onClick={() => setMostrarResumenPagos(true)}
      className="bg-indigo-700 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2"
    >
      <DollarSign className="w-5 h-5" />
      Ver Saldo Diario
    </button>
  </div>
)}

{mostrarResumenPagos && (
  <ModalResumenSaldo 
    movimientos={movimientosFiltrados} 
    onClose={() => setMostrarResumenPagos(false)} 
  />
)}
        </div>
      </div>
    </div>
  );
}