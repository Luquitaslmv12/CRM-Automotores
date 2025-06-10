import React, { useEffect } from 'react';

export default function ToastNotification({ show, message, type, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const bgColor =
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    'bg-gray-600';

  return (
    <div className={`fixed bottom-6 right-6 px-6 py-3 rounded shadow-lg text-white ${bgColor} z-50`}>
      {message}
    </div>
  );
}