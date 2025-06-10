import React from 'react';

export default function Avatar({ usuario, size = 32 }) {
  const inicial = usuario?.nombre
    ? usuario.nombre[0].toUpperCase()
    : usuario?.email
    ? usuario.email[0].toUpperCase()
    : '?';

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-white font-semibold uppercase select-none"
    >
      {usuario?.fotoURL ? (
        <img
          src={usuario.fotoURL}
          alt="Avatar"
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        inicial
      )}
    </div>
  );
}