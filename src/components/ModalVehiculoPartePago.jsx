import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import BuscadorCliente from "./BuscadorCliente";

export default function ModalVehiculoPartePago({
  vehiculo,
  onClose,
  onSave,
  modo,
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [recibidoPor, setRecibidoPor] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [activeTab, setActiveTab] = useState("basicos"); // Para pestañas

  const [vehiculoState, setVehiculoState] = useState({
    marca: "",
    modelo: "",
    año: "",
    color: "",
    monto: "",
    patente: "",
    tipo: "",
    etiqueta: "Usado",
    motor: "",
    chasis: "",
    kilometraje: "",
    combustible: "Nafta",
    transmision: "Manual",
    observaciones: "",
    fechaIngreso: new Date().toISOString().split('T')[0],
    documentos: ""
  });

  useEffect(() => {
    const fetchUsuarios = async () => {
      const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
      const usuariosList = usuariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(usuariosList);
    };

    fetchUsuarios();
  }, []);

  // Cargar datos si se edita un vehículo existente
  useEffect(() => {
    if (vehiculo) {
      setVehiculoState({
        marca: vehiculo.marca || "",
        modelo: vehiculo.modelo || "",
        año: vehiculo.año || "",
        color: vehiculo.color || "",
        monto: vehiculo.monto || "",
        patente: vehiculo.patente || "",
        tipo: vehiculo.tipo || "",
        etiqueta: vehiculo.etiqueta || "Usado",
        motor: vehiculo.motor || "",
        chasis: vehiculo.chasis || "",
        kilometraje: vehiculo.kilometraje || "",
        combustible: vehiculo.combustible || "Nafta",
        transmision: vehiculo.transmision || "Manual",
        observaciones: vehiculo.observaciones || "",
        fechaIngreso: vehiculo.fechaIngreso || new Date().toISOString().split('T')[0],
        documentos: vehiculo.documentos || "Completos"
      });
      setRecibidoPor(vehiculo.recibidoPor || "");
    }
  }, [vehiculo]);

  const handleChange = (e) => {
    setVehiculoState({ ...vehiculoState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...vehiculoState,
      recibidoPor,
      cliente: clienteSeleccionado,
      fechaEntrega: new Date(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            {modo === "compra" ? "Vehículo en Compra" : "Vehículo Parte de Pago"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pestañas */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab("basicos")}
                className={`inline-block p-4 ${activeTab === "basicos" ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500" : "text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`}
              >
                Datos Básicos
              </button>
            </li>
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab("tecnicos")}
                className={`inline-block p-4 ${activeTab === "tecnicos" ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500" : "text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`}
              >
                Datos Técnicos
              </button>
            </li>
            <li className="mr-2">
              <button
                type="button"
                onClick={() => setActiveTab("adicionales")}
                className={`inline-block p-4 ${activeTab === "adicionales" ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500" : "text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`}
              >
                Adicionales
              </button>
            </li>
          </ul>
        </div>

        {/* Contenido de pestañas */}
        <div className="space-y-4">
          {activeTab === "basicos" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Recibido por*</label>
                  <select
                    value={recibidoPor}
                    onChange={(e) => setRecibidoPor(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    required
                  >
                    <option value="">Seleccione un usuario</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.nombre}>
                        {usuario.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {modo === "compra" && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Asignar Cliente</label>
                    <BuscadorCliente
                      value={clienteSeleccionado}
                      onChange={setClienteSeleccionado}
                      placeholder="Dueño del vehículo"
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de vehículo*</label>
                  <select
                    name="etiqueta"
                    value={vehiculoState.etiqueta}
                    onChange={handleChange}
                    className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    required
                  >
                    <option value="Usado">Usado</option>
                    <option value="0km">0km</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Marca*</label>
                  <input
                    name="marca"
                    placeholder="Ej: Ford, Toyota"
                    value={vehiculoState.marca}
                    onChange={handleChange}
                    className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Modelo*</label>
                  <input
                    name="modelo"
                    placeholder="Ej: Focus, Corolla"
                    value={vehiculoState.modelo}
                    onChange={handleChange}
                    className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo*</label>
                  <input
                    name="tipo"
                    placeholder="Ej: Sedán, SUV, Pickup"
                    value={vehiculoState.tipo}
                    onChange={handleChange}
                    className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Patente</label>
                  <input
                    name="patente"
                    placeholder="Ej: AB123CD"
                    value={vehiculoState.patente}
                    onChange={handleChange}
                    className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white uppercase"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Año*</label>
                  <input
                    name="año"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="Año"
                    value={vehiculoState.año}
                    onChange={handleChange}
                    className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                  <input
                    name="color"
                    placeholder="Color principal"
                    value={vehiculoState.color}
                    onChange={handleChange}
                    className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Monto tomado</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">$</span>
                    </div>
                    <input
                      name="monto"
                      type="number"
                      step="0.01"
                      placeholder="Valor del vehículo"
                      value={vehiculoState.monto}
                      onChange={handleChange}
                      className="w-full p-3 pl-8 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                  </div>
                  {vehiculoState.monto && (
                    <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                      {Number(vehiculoState.monto).toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "tecnicos" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Número de motor</label>
                <input
                  name="motor"
                  placeholder="Número completo del motor"
                  value={vehiculoState.motor}
                  onChange={handleChange}
                  className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Número de chasis</label>
                <input
                  name="chasis"
                  placeholder="Número completo del chasis"
                  value={vehiculoState.chasis}
                  onChange={handleChange}
                  className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Kilometraje</label>
                <input
                  name="kilometraje"
                  type="number"
                  placeholder="Kilómetros"
                  value={vehiculoState.kilometraje}
                  onChange={handleChange}
                  className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de combustible</label>
                <select
                  name="combustible"
                  value={vehiculoState.combustible}
                  onChange={handleChange}
                  className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                >
                  <option value="Nafta">Nafta</option>
                  <option value="Diésel">Diésel</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Eléctrico">Eléctrico</option>
                  <option value="GNC">GNC</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Transmisión</label>
                <select
                  name="transmision"
                  value={vehiculoState.transmision}
                  onChange={handleChange}
                  className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                >
                  <option value="Manual">Manual</option>
                  <option value="Automática">Automática</option>
                  <option value="CVT">CVT</option>
                  <option value="Semi-automática">Semi-automática</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "adicionales" && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de ingreso</label>
                <input
                  name="fechaIngreso"
                  type="date"
                  value={vehiculoState.fechaIngreso}
                  onChange={handleChange}
                  className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Documentación</label>
                <select
                  name="documentos"
                  value={vehiculoState.documentos}
                  onChange={handleChange}
                  className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                >
                  <option value="Completos">Completos</option>
                  <option value="Faltantes">Faltantes</option>
                  <option value="En trámite">En trámite</option>
                  <option value="No entrega">No entrega</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                <textarea
                  name="observaciones"
                  rows="3"
                  placeholder="Detalles adicionales sobre el vehículo"
                  value={vehiculoState.observaciones}
                  onChange={handleChange}
                  className="w-full p-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                ></textarea>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            {vehiculo ? "Actualizar" : "Guardar"} vehículo
          </button>
        </div>
      </form>
    </div>
  );
}