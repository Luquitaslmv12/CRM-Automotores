import { useState, useEffect } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Car } from 'lucide-react';

export default function BuscadorVehiculo({ value, onChange }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vehiculos'), (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVehiculos(datos);
    });
    return () => unsub();
  }, []);

  const vehiculosFiltrados =
    query === ''
      ? vehiculos
      : vehiculos.filter((v) =>
          `${v.marca} ${v.modelo} ${v.patente}`.toLowerCase().includes(query.toLowerCase())
        );

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === value);

  return (
    <Combobox value={value} onChange={onChange} >
      <div className="relative mb-6">
        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
        <ComboboxInput
          className="w-full p-3 px-10 rounded bg-slate-700 border border-slate-600 focus:outline-none text-white focus:ring-2 focus:ring-indigo-400"
          displayValue={() =>
            vehiculoSeleccionado
              ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} (${vehiculoSeleccionado.patente})`
              : ''
          }
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar vehículo..."
        />
        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-white">
          <ComboboxOption value="">
            <span className="block px-4 py-2 text-gray-400 italic">Sin asignar</span>
          </ComboboxOption>
          {vehiculosFiltrados.length === 0 ? (
            <div className="px-4 py-2 text-gray-400">No se encontraron vehículos</div>
          ) : (
            vehiculosFiltrados.map((v) => (
              <ComboboxOption
                key={v.id}
                value={v.id}
                className={({ active }) =>
                  `cursor-pointer px-4 py-2 ${active ? 'bg-indigo-600 text-white' : 'text-white'}`
                }
              >
                {v.marca} {v.modelo} ({v.patente})
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
