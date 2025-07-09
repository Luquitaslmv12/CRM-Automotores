import { useState, useEffect } from "react";
import {
  Combobox,
  ComboboxOption,
  ComboboxOptions,
  ComboboxInput,
} from "@headlessui/react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Search } from "lucide-react";

export default function BuscadorCliente({ value, onChange, placeholder }) {
  const [clientes, setClientes] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "clientes"), (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClientes(datos);
    });
    return () => unsub();
  }, []);

  const clientesFiltrados =
    query === ""
      ? clientes
      : clientes.filter((c) =>
          `${c.nombre} ${c.apellido}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );

  const clienteSeleccionado =
    typeof value === "object"
      ? clientes.find((c) => c.id === value?.id)
      : clientes.find((c) => c.id === value);

  return (
    <Combobox value={value} onChange={onChange}>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
        <ComboboxInput
          className="w-full p-3 px-10 rounded bg-slate-700 border border-slate-600 focus:outline-none text-white focus:ring-2 focus:ring-indigo-400"
          displayValue={() =>
            clienteSeleccionado
              ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
              : ""
          }
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-white">
          <ComboboxOption value="">
            <span className="block px-4 py-2 text-gray-400 italic">
              Sin asignar
            </span>
          </ComboboxOption>
          {clientesFiltrados.length === 0 ? (
            <div className="px-4 py-2 text-gray-400">
              No se encontraron clientes
            </div>
          ) : (
            clientesFiltrados.map((c) => (
              <ComboboxOption
                key={c.id}
                value={c} // 👉 pasa el objeto cliente completo
                className={({ active }) =>
                  `cursor-pointer px-4 py-2 ${
                    active ? "bg-indigo-600 text-white" : "text-white"
                  }`
                }
              >
                {c.nombre} {c.apellido} - DNI {c.dni}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
