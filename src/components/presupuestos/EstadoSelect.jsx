// components/EstadoSelect.jsx
import { Listbox } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

const estados = [
  { value: "abierto", label: "Abierto", color: "bg-yellow-600" },
  { value: "cerrado", label: "Cerrado", color: "bg-green-700" },
  { value: "perdido", label: "Perdido", color: "bg-red-700" },
];

export default function EstadoSelect({ value, onChange }) {
  return (
    <div className="w-48">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button
            className={clsx(
              "w-full flex justify-between items-center border-2 text-white rounded px-3 py-2 text-sm",
              value.color
            )}
          >
            {value.label}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Listbox.Button>

          <Listbox.Options className="absolute mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow-lg z-10">
            {estados.map((estado) => (
              <Listbox.Option
                key={estado.value}
                value={estado}
                className={({ active, selected }) =>
                  clsx(
                    "cursor-pointer px-4 py-2 text-sm flex justify-between items-center",
                    active ? "bg-gray-700" : "",
                    selected ? "font-semibold text-white" : "text-gray-300"
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span>{estado.label}</span>
                    {selected && <Check className="w-4 h-4 text-green-400" />}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}

export { estados };
