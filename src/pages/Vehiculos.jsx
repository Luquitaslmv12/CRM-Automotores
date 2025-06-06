import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const estados = ['Disponible', 'Vendido', 'Mantenimiento'];
const tipos = ['Auto', 'Camioneta', 'Moto', 'Otro'];

export default function Vehiculos() {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [patente, setPatente] = useState('');
  const [numeroMotor, setNumeroMotor] = useState('');
  const [color, setColor] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [estado, setEstado] = useState(estados[0]);
  const [precioVenta, setPrecioVenta] = useState('');
  const [tipo, setTipo] = useState(tipos[0]);
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditar, setIdEditar] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'vehiculos'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehiculos(lista);
    });
    return () => unsubscribe();
  }, []);

  const limpiarFormulario = () => {
    setMarca('');
    setModelo('');
    setAnio('');
    setPatente('');
    setNumeroMotor('');
    setColor('');
    setKilometraje('');
    setEstado(estados[0]);
    setPrecioVenta('');
    setTipo(tipos[0]);
    setModoEdicion(false);
    setIdEditar(null);
  };

  const guardarVehiculo = async () => {
    if (!marca || !modelo || !anio || !patente) return alert('Completa todos los campos obligatorios');

    try {
      const datos = {
        marca,
        modelo,
        anio: Number(anio),
        patente,
        numeroMotor,
        color,
        kilometraje: Number(kilometraje),
        estado,
        precioVenta: Number(precioVenta),
        tipo,
        fotos: [],
        fechaRegistro: new Date(),
      };

      if (modoEdicion) {
        await updateDoc(doc(db, 'vehiculos', idEditar), datos);
      } else {
        await addDoc(collection(db, 'vehiculos'), datos);
      }
      limpiarFormulario();
    } catch (err) {
      console.error(err);
      alert('Error al guardar vehículo');
    }
  };

  const eliminarVehiculo = async (id) => {
    try {
      await deleteDoc(doc(db, 'vehiculos', id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar vehículo');
    }
  };

  const editarVehiculo = (vehiculo) => {
    setMarca(vehiculo.marca);
    setModelo(vehiculo.modelo);
    setAnio(vehiculo.anio);
    setPatente(vehiculo.patente);
    setNumeroMotor(vehiculo.numeroMotor);
    setColor(vehiculo.color);
    setKilometraje(vehiculo.kilometraje);
    setEstado(vehiculo.estado);
    setPrecioVenta(vehiculo.precioVenta);
    setTipo(vehiculo.tipo);
    setIdEditar(vehiculo.id);
    setModoEdicion(true);
  };

  const resultados = vehiculos.filter(v =>
    v.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.modelo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión de Vehículos</h1>

      <div className="bg-white p-6 rounded shadow mb-6 space-y-4">
        <input
          type="text"
          placeholder="Marca *"
          className="border p-2 w-full"
          value={marca}
          onChange={e => setMarca(e.target.value)}
        />
        <input
          type="text"
          placeholder="Modelo *"
          className="border p-2 w-full"
          value={modelo}
          onChange={e => setModelo(e.target.value)}
        />
        <input
          type="number"
          placeholder="Año *"
          className="border p-2 w-full"
          value={anio}
          onChange={e => setAnio(e.target.value)}
        />
        <input
          type="text"
          placeholder="Patente *"
          className="border p-2 w-full"
          value={patente}
          onChange={e => setPatente(e.target.value)}
        />
        <input
          type="text"
          placeholder="Número de motor"
          className="border p-2 w-full"
          value={numeroMotor}
          onChange={e => setNumeroMotor(e.target.value)}
        />
        <input
          type="text"
          placeholder="Color"
          className="border p-2 w-full"
          value={color}
          onChange={e => setColor(e.target.value)}
        />
        <input
          type="number"
          placeholder="Kilometraje"
          className="border p-2 w-full"
          value={kilometraje}
          onChange={e => setKilometraje(e.target.value)}
        />
        <select
          value={estado}
          onChange={e => setEstado(e.target.value)}
          className="border p-2 w-full"
        >
          {estados.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Precio de venta"
          className="border p-2 w-full"
          value={precioVenta}
          onChange={e => setPrecioVenta(e.target.value)}
        />
        <select
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          className="border p-2 w-full"
        >
          {tipos.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          onClick={guardarVehiculo}
          className={`w-full py-3 rounded text-white ${
            modoEdicion ? 'bg-green-600' : 'bg-blue-600'
          }`}
        >
          {modoEdicion ? 'Guardar cambios' : 'Agregar vehículo'}
        </button>

        {modoEdicion && (
          <button
            onClick={limpiarFormulario}
            className="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded"
          >
            Cancelar edición
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Buscar por patente, marca o modelo..."
        className="border p-2 mb-4 w-full"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      <div className="space-y-3">
        {resultados.map(vehiculo => (
          <div
            key={vehiculo.id}
            className="bg-gray-100 p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">{vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})</p>
              <p className="text-sm text-gray-600">Patente: {vehiculo.patente}</p>
              <p className="text-sm text-gray-600">Estado: {vehiculo.estado}</p>
              <p className="text-sm text-gray-600">Precio: ${vehiculo.precioVenta?.toLocaleString()}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => editarVehiculo(vehiculo)}
                className="text-blue-600 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => eliminarVehiculo(vehiculo.id)}
                className="text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
