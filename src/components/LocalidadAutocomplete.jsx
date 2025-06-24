import { React, useEffect, useState } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { Search } from "lucide-react";

export default function LocalidadAutocomplete({ localidad, setLocalidad }) {
  const [seleccionManual, setSeleccionManual] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
  });

  // Sync externo → interno
  useEffect(() => {
    if (!seleccionManual) {
      setValue(localidad || "");
      setMostrarSugerencias(false); // ocultar sugerencias cuando carga externo
    } else {
      setSeleccionManual(false);
    }
  }, [localidad]);

  const handleInput = (e) => {
    setValue(e.target.value);
    setMostrarSugerencias(true); // mostrar sugerencias al escribir
  };

  const handleSelect = async (address) => {
    setSeleccionManual(true);
    setValue(address, false);
    clearSuggestions();
    setMostrarSugerencias(false); // ocultar al seleccionar
    setLocalidad(address);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      console.log("Ubicación:", { lat, lng });
    } catch (error) {
      console.error("Error al buscar coordenadas", error);
    }
  };

  return (
    <div className="relative md:col-span-2 focus-within:ring-2 focus-within:ring-indigo-500/50 rounded-xl transition">
      <Search className="absolute left-3 top-8 -translate-y-1/2 text-blue-500 w-5 h-5" />
      <input
        id="localidad-input"
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder=" "
        className="peer px-10 p-3 pt-5 w-full rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-transparent text-white transition"
        autoComplete="off"
      />
      <label
        htmlFor="localidad-input"
        className="absolute left-10 top-1 text-lime-400 text-sm transition-all
            peer-placeholder-shown:top-0 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-200
            peer-focus:top-0 peer-focus:text-sm peer-focus:text-indigo-300"
      >
        Localidad
      </label>

      {status === "OK" && mostrarSugerencias && (
        <ul className="absolute z-50 bg-slate-900 border border-slate-700 w-full mt-1 max-h-48 overflow-auto rounded shadow-lg">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="cursor-pointer px-3 py-2 hover:bg-indigo-600"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
