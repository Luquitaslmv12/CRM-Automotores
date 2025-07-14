import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { Truck, Calendar, DollarSign, Wrench } from "lucide-react";

export default function ProveedorDetalle() {
  const { id } = useParams();
  const [proveedor, setProveedor] = useState(null);
  const [reparaciones, setReparaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProveedorYReparaciones = async () => {
      setLoading(true);

      // 1) Traer datos del proveedor
      const proveedorSnap = await getDoc(doc(db, "proveedores", id));
      if (proveedorSnap.exists()) {
        setProveedor(proveedorSnap.data());
      } else {
        setProveedor(null);
      }

      // 2) Query reparaciones para este proveedor (tallerId)
      const reparacionesQuery = query(
        collection(db, "reparaciones"),
        where("tallerId", "==", id)
      );
      const reparacionSnaps = await getDocs(reparacionesQuery);

      // 3) Para cada reparación, traer datos básicos del vehículo
      const reparacionesData = await Promise.all(
        reparacionSnaps.docs.map(async (docSnap) => {
          const repData = docSnap.data();
          const vehiculoSnap = await getDoc(
            doc(db, "vehiculos", repData.vehiculoId)
          );
          const vehiculoData = vehiculoSnap.exists()
            ? vehiculoSnap.data()
            : null;
          return {
            id: docSnap.id,
            ...repData,
            vehiculo: vehiculoData,
          };
        })
      );

      setReparaciones(reparacionesData);
      setLoading(false);
    };

    fetchProveedorYReparaciones();
  }, [id]);

  if (loading) return <div className="p-6 text-white">Cargando datos...</div>;
  if (!proveedor)
    return <div className="p-6 text-white">Proveedor no encontrado.</div>;

  return (
    <div className="p-6 pt-18 text-white max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📋 {proveedor.nombre}</h1>

      <div className="mb-6 space-y-1 text-sm text-gray-300">
        <p>
          <strong>📍 Dirección:</strong>{" "}
          {proveedor.direccion || "Sin especificar"}
        </p>
        <p>
          <strong>📞 Teléfono:</strong>{" "}
          {proveedor.telefono || "Sin especificar"}
        </p>
        <p>
          <strong>📧 Email:</strong> {proveedor.email || "Sin especificar"}
        </p>
        <p>
          <strong>🛠️ Tipo de servicio:</strong> {proveedor.tipo || "General"}
        </p>
        <p>
          <strong>📝 Notas:</strong> {proveedor.observaciones || "Sin notas"}
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        🚗 Reparaciones realizadas
      </h2>
      {reparaciones.length === 0 ? (
        <p className="text-gray-400">
          No hay reparaciones registradas para este proveedor.
        </p>
      ) : (
        <ul className="space-y-4">
          {reparaciones.map((rep) => {
            const v = rep.vehiculo || {};
            // Fechas Firestore a JS Date para mostrar
            const fechaIngreso = rep.fechaIngreso?.toDate?.() || null;
            const fechaSalida = rep.fechaSalida?.toDate?.() || null;

            return (
              <li
                key={rep.id}
                className="bg-gray-800 p-4 rounded-xl border-l-4 border-indigo-500"
              >
                <div className="text-lg font-semibold text-indigo-300 mb-1 flex items-center gap-2">
                  <Truck size={18} />
                  {v.marca || "Vehículo no encontrado"} {v.modelo || ""}
                  {" - "}
                  <span className="font-mono">{v.patente || "???"}</span>
                </div>

                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    <strong>Estado:</strong> {rep.estado || "No especificado"}
                  </p>
                  <p>
                    <DollarSign className="inline-block mr-1" size={14} />
                    <strong>Precio:</strong>{" "}
                    {rep.precioServicio
                      ? `$${rep.precioServicio.toLocaleString("es-AR")}`
                      : "No ingresado"}
                  </p>
                  <p>
                    <Calendar className="inline-block mr-1" size={14} />
                    <strong>Ingreso:</strong>{" "}
                    {fechaIngreso
                      ? fechaIngreso.toLocaleDateString("es-AR")
                      : "Sin fecha"}
                  </p>
                  {fechaSalida && (
                    <p>
                      <Calendar className="inline-block mr-1" size={14} />
                      <strong>Salida:</strong>{" "}
                      {fechaSalida.toLocaleDateString("es-AR")}
                    </p>
                  )}
                  <p>
                    <Wrench className="inline-block mr-1" size={14} />
                    <strong>Trabajo:</strong>{" "}
                    {rep.descripcionReparacion || "Sin descripción"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
