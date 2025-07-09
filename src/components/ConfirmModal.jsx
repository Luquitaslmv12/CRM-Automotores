import React from 'react';
import { AlertTriangle } from "lucide-react";
import Spinner from '../components/Spinner/Spinner';

export default function ConfirmModal({ isOpen, onCancel, onConfirm, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-700">
        <div className="flex items-center gap-3 mb-4 text-yellow-400">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-slate-300 mb-6 text-sm">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className={`px-4 py-2 rounded border border-gray-500 text-gray-200 hover:bg-gray-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {loading ? <Spinner text="Eliminando..." /> : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
