import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('user'); // por defecto user
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const auth = getAuth();

    try {
      // Crear usuario en Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Guardar rol y datos en Firestore
      await setDoc(doc(db, 'usuarios', uid), {
        rol,
        nombre: '',
        email,
      });

      setSuccess('Usuario creado correctamente');
      setEmail('');
      setPassword('');
      setRol('user');
    } catch (err) {
      console.error(err);
      setError('Error al crear usuario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Panel de Admin - Crear Usuario</h2>
      <form onSubmit={handleCrearUsuario} noValidate>
        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full mb-4 px-3 py-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full mb-4 px-3 py-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <select
          className="w-full mb-4 px-3 py-2 border rounded"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          <option value="user">Usuario</option>
          <option value="admin">Admin</option>
          <option value="vendedor">Vendedor</option>
        </select>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creando...' : 'Crear Usuario'}
        </button>
      </form>
    </div>
  );
}
