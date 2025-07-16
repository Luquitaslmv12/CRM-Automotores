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

    // Agrupar por día
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

    // Calcular resumen mensual
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

  // Cargar movimientos con ordenamiento
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

  // Calcular saldo acumulado hasta la fecha seleccionada
  const calcularSaldoAcumulado = async () => {
    try {
      const hasta = Timestamp.fromDate(
        new Date(new Date(fecha).setHours(23, 59, 59, 999))
      );
      const q = query(
        collection(db, "caja_diaria"),
        where("fecha", "<=", hasta),
        orderBy("fecha", "asc") // Orden ascendente para cálculo correcto
      );
      const snapshot = await getDocs(q);
      const datos = snapshot.docs.map((doc) => doc.data());

      let saldo = 0;
      const saldosPorDia = [];
      
      // Agrupar por día y calcular saldo acumulado
      const movimientosPorDia = datos.reduce((acc, m) => {
        const fechaMov = dayjs(m.fecha?.toDate?.() || m.fecha).format("YYYY-MM-DD");
        if (!acc[fechaMov]) {
          acc[fechaMov] = { ingresos: 0, egresos: 0 };
        }
        if (m.tipo === "ingreso") {
          acc[fechaMov].ingresos += parseFloat(m.monto);
          saldo += parseFloat(m.monto);
        } else {
          acc[fechaMov].egresos += parseFloat(m.monto);
          saldo -= parseFloat(m.monto);
        }
        return acc;
      }, {});

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

  // Agregar movimiento con validación
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

  // Eliminar movimiento con confirmación
  const handleEliminar = async (id) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-red-200">
        <p className="font-medium mb-3">¿Estás seguro de eliminar este movimiento?</p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
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

  // Guardar edición
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

  // Exportar a Excel con más detalles
  const exportarExcel = () => {
  let data, nombreArchivo;
  
  if (verMesCompleto) {
    // Exportar datos mensuales
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
    // Exportar datos diarios o completos
    data = movimientosFiltrados.map((m) => ({
      Fecha: dayjs(m.fecha?.toDate?.() || m.fecha).format("YYYY-MM-DD HH:mm"),
      Descripción: m.descripcion,
      Tipo: m.tipo === "ingreso" ? "Ingreso" : "Egreso",
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

  // Agregar hoja de resumen
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


  // Copiar resumen al portapapeles
  const copiarResumen = () => {
  let resumen;
  
  if (verMesCompleto) {
    resumen = `Resumen Mensual - ${dayjs(fecha).format("MMMM YYYY")}
    
Total Ingresos: ${resumenMensual.ingresos.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })}
Total Egresos: ${resumenMensual.egresos.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })}
Saldo Mensual: ${resumenMensual.saldo.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })}
Días con movimientos: ${movimientosMensuales.length}`;
  } else {
    resumen = `Resumen Caja ${verTodo ? "Completa" : "Diaria"} - ${dayjs(fecha).format("DD/MM/YYYY")}
    
Total Ingresos: ${totalIngresos.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })}
Total Egresos: ${totalEgresos.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })}
Saldo: ${saldo.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })}
${!verTodo ? `Saldo Acumulado: ${saldoAcumulado.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    })}\n` : ''}
Movimientos: ${movimientosFiltrados.length}`;
  }

  navigator.clipboard.writeText(resumen);
  toast.success("Resumen copiado al portapapeles");
  setShowCopied(true);
  setTimeout(() => setShowCopied(false), 2000);
};
  // Filtrar movimientos
  const movimientosFiltrados = movimientos.filter((m) => {
    const desc = m.descripcion.toLowerCase().includes(filtroDescripcion.toLowerCase());
    const tipoOK = filtroTipo === "todos" || m.tipo === filtroTipo;
    const busquedaOK = busquedaRapida 
      ? m.descripcion.toLowerCase().includes(busquedaRapida.toLowerCase()) || 
        m.monto.toString().includes(busquedaRapida)
      : true;
    return desc && tipoOK && busquedaOK;
  });

  // Calcular totales
  const totalIngresos = movimientosFiltrados
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + parseFloat(m.monto), 0);

  const totalEgresos = movimientosFiltrados
    .filter((m) => m.tipo === "egreso")
    .reduce((acc, m) => acc + parseFloat(m.monto), 0);

  const saldo = totalIngresos - totalEgresos;

  // Manejar teclas rápidas
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

  // Ordenar por columna
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

  // Formatear fecha para mostrar
  const formatoFecha = (fecha) => {
    const hoy = dayjs().format("YYYY-MM-DD");
    const ayer = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    const fechaMov = dayjs(fecha?.toDate?.() || fecha).format("YYYY-MM-DD");
    
    if (fechaMov === hoy) return "Hoy";
    if (fechaMov === ayer) return "Ayer";
    return dayjs(fecha?.toDate?.() || fecha).format("DD/MM/YYYY");
  };

  // Navegación rápida de fechas
  const cambiarFecha = (dias) => {
    setFecha(dayjs(fecha).add(dias, "day").format("YYYY-MM-DD"));
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-800 text-white">
      <div
        className="max-w-6xl mx-auto bg-white rounded-xl  rounded-3xl shadow-[0_0_60px_10px_rgba(8,170,234,0.4)] border-2 border-blue-500 overflow-hidden"
        onKeyDown={handleKeyPress}
        tabIndex={0}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Gestión de Caja Diaria</h1>
              <p className="text-blue-100">
                {verTodo 
                  ? "Viendo todo el historial" 
                  : `Viendo movimientos del ${dayjs(fecha).format("DD/MM/YYYY")}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => cargarMovimientos()}
                className="p-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                title="Recargar"
              >
                <RefreshCw className={`w-5 h-5 ${cargando ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                title="Imprimir"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Controles principales */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarFecha(-1)}
                className="p-2 bg-gray-600 rounded-full  hover:bg-gray-800 transition-colors cursor-pointer"
                disabled={verTodo}
                title="Día anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-slate-800 text-left-5 bg-slate-100 border-2 border-indigo-500 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={verTodo}
                  />
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <button
                onClick={() => cambiarFecha(1)}
                className="p-2 bg-gray-600 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                disabled={verTodo}
                title="Día siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setVerTodo((prev) => !prev)}
                className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 ${
                  verTodo 
                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda rápida:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar en descripción o monto"
                  value={busquedaRapida}
                  onChange={(e) => setBusquedaRapida(e.target.value)}
                  className="w-full border border-gray-300 p-2 pl-10 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Formulario de movimiento */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Nuevo Movimiento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Type className="w-4 h-4 text-blue-600" />
                  Descripción:
                </label>
                <input
                  ref={descripcionRef}
                  type="text"
                  placeholder="Ej: Venta de productos"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Monto:
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo:
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipo("ingreso")}
                    className={`flex-1 py-2 px-3 rounded-md font-medium flex items-center justify-center gap-2 ${
                      tipo === "ingreso" 
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                    Ingreso
                  </button>
                  <button
                    onClick={() => setTipo("egreso")}
                    className={`flex-1 py-2 px-3 rounded-md font-medium flex items-center justify-center gap-2 ${
                      tipo === "egreso" 
                        ? "bg-red-600 text-white hover:bg-red-700" 
                        : "bg-red-100 text-red-800 hover:bg-red-200"
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
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-5 h-5" />
              Agregar Movimiento
            </button>
          </div>
        </div>

        {/* Controles secundarios */}
        <div className="p-6 border-b">
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${
                showFiltros 
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-700" 
                  : "bg-blue-100 hover:bg-blue-200 text-blue-700"
              }`}
            >
              {showFiltros ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              Filtros Avanzados
            </button>

            <button
              onClick={exportarExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exportar Excel
            </button>

            <button
              onClick={copiarResumen}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
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
      ? "bg-orange-600 hover:bg-orange-700 text-white" 
      : "bg-orange-500 hover:bg-orange-600 text-white"
  }`}
>
  <Calendar className="w-5 h-5" />
  {verMesCompleto ? "Ver día actual" : "Ver mes completo"}
</button>
          </div>

          {showFiltros && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar en descripción:
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por descripción"
                  value={filtroDescripcion}
                  onChange={(e) => setFiltroDescripcion(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por tipo:
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos los movimientos</option>
                  <option value="ingreso">Solo ingresos</option>
                  <option value="egreso">Solo egresos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por:
                </label>
                <select
                  value={`${orden.campo}_${orden.direccion}`}
                  onChange={(e) => {
                    const [campo, direccion] = e.target.value.split("_");
                    setOrden({ campo, direccion });
                  }}
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : verMesCompleto ? (
    /* Vista mensual */
    <>
    
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => cambiarMes(-1)}
          className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          <ChevronLeft className="w-4 h-4" />
          Mes anterior
        </button>
        
        <h2 className="text-xl font-bold text-gray-800">
          {dayjs(fecha).format("MMMM YYYY")}
        </h2>
        
        <button
          onClick={() => cambiarMes(1)}
          className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Mes siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-xl font-bold text-blue-800 mb-3">Resumen Mensual</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium">Total Ingresos</p>
            <p className="text-2xl font-bold text-green-800">
              {resumenMensual.ingresos.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS"
              })}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-600 font-medium">Total Egresos</p>
            <p className="text-2xl font-bold text-red-800">
              {resumenMensual.egresos.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS"
              })}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Saldo Mensual</p>
            <p className="text-2xl font-bold text-blue-800">
              {resumenMensual.saldo.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS"
              })}
            </p>
          </div>
        </div>
        <div className="mt-4 text-sm text-blue-600">
          <p>Mes: {dayjs(fecha).format("MMMM YYYY")}</p>
          <p>Días con movimientos: {movimientosMensuales.length}</p>
        </div>
      </div>

      {movimientosMensuales.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay movimientos en este mes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {movimientosMensuales.map((dia) => (
            <div key={dia.fecha} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-700">
                    {formatoFecha(dia.fecha)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({dia.movimientos.length} movimientos)
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-green-600 font-medium">
                    +{dia.ingresos.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS"
                    })}
                  </span>
                  <span className="text-red-600 font-medium">
                    -{dia.egresos.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS"
                    })}
                  </span>
                  <span className="font-medium">
                    Saldo: {(dia.ingresos - dia.egresos).toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS"
                    })}
                  </span>
                </div>
              </div>
              <div className="divide-y">
                {dia.movimientos.map((movimiento) => (
                  <div key={movimiento.id} className="p-3 hover:bg-gray-50 flex justify-between">
                    <div>
                      <p className="font-medium">{movimiento.descripcion}</p>
                      <p className="text-sm text-gray-500">
                        {dayjs(movimiento.fecha?.toDate?.() || movimiento.fecha).format("HH:mm")}
                      </p>
                    </div>
                    <div className={`font-medium ${
                      movimiento.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                    }`}>
                      {movimiento.tipo === "ingreso" ? "+" : "-"}
                      {parseFloat(movimiento.monto).toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS"
                      })}
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
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      <p className="text-gray-500">
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
      <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientosFiltrados.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatoFecha(m.fecha?.toDate?.() || m.fecha)}
                        <div className="text-xs text-gray-400">
                          {dayjs(m.fecha?.toDate?.() || m.fecha).format("HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                            className="border p-1 rounded w-full focus:ring-2 focus:ring-blue-500"
                            onKeyPress={handleKeyPress}
                            autoFocus
                          />
                        ) : (
                          m.descripcion
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            className="border p-1 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="ingreso">Ingreso</option>
                            <option value="egreso">Egreso</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            m.tipo === "ingreso" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editando === m.id ? (
                          <input
                            type="number"
                            value={m.monto}
                            onChange={(e) =>
                              setMovimientos((prev) =>
                                prev.map((x) =>
                                  x.id === m.id ? { ...x, monto: parseFloat(e.target.value) || 0 } : x
                                )
                              )
                            }
                            className="border p-1 rounded w-24 focus:ring-2 focus:ring-blue-500"
                            onKeyPress={handleKeyPress}
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span className={`font-medium ${
                            m.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                          }`}>
                            {m.tipo === "ingreso" ? "+" : "-"}{" "}
                            {parseFloat(m.monto).toLocaleString("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            })}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          {editando === m.id ? (
                            <>
                              <button
                                onClick={() => handleGuardarEdicion(m.id, m)}
                                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                title="Guardar"
                              >
                                <Save className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditando(null)}
                                className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                                title="Cancelar"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEditando(m.id)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEliminar(m.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
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
        
     <div className="p-4 rounded-lg space-y-4">
  <h2 className="text-lg font-semibold text-gray-700">
    Resumen {verTodo ? "General" : "Diario"}
  </h2>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Tarjeta de Ingresos */}
    <div className="bg-gradient-to-br from-green-50 to-green-25 p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-2 mb-1">
        <div className="p-1.5 rounded-full bg-green-100">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-green-800">Total Ingresos</h3>
      </div>
      <p className="text-2xl font-bold text-green-700">
        {totalIngresos.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        })}
      </p>
      {!verTodo && (
        <p className="text-xs text-green-600 mt-1">vs ayer: +2.5%</p>
      )}
    </div>
    
    {/* Tarjeta de Egresos */}
    <div className="bg-gradient-to-br from-red-50 to-red-25 p-4 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-2 mb-1">
        <div className="p-1.5 rounded-full bg-red-100">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-red-800">Total Egresos</h3>
      </div>
      <p className="text-2xl font-bold text-red-700">
        {totalEgresos.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        })}
      </p>
      {!verTodo && (
        <p className="text-xs text-red-600 mt-1">vs ayer: -1.3%</p>
      )}
    </div>
    
    {/* Tarjeta de Saldo */}
    <div className={`bg-gradient-to-br p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
      saldo >= 0 
        ? "from-blue-50 to-blue-25 border-blue-200" 
        : "from-orange-50 to-orange-25 border-orange-200"
    }`}>
      <div className="flex items-center space-x-2 mb-1">
        <div className={`p-1.5 rounded-full ${
          saldo >= 0 ? "bg-blue-100" : "bg-orange-100"
        }`}>
          <svg className={`w-4 h-4 ${
            saldo >= 0 ? "text-blue-600" : "text-orange-600"
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className={`text-sm font-medium ${
          saldo >= 0 ? "text-blue-800" : "text-orange-800"
        }`}>
          Saldo {verTodo ? "General" : "Diario"}
        </h3>
      </div>
      <p className={`text-2xl font-bold ${
        saldo >= 0 ? "text-blue-700" : "text-orange-700"
      }`}>
        {saldo.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        })}
      </p>
      {!verTodo && (
        <p className={`text-xs mt-1 ${
          saldo >= 0 ? "text-blue-600" : "text-orange-600"
        }`}>
          {saldo >= 0 ? "↑ Favorable" : "↓ Atención requerida"}
        </p>
      )}
    </div>
  </div>
</div>
      </div>
    </div>
    
  );
}