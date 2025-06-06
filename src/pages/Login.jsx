import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario) {
      navigate('/dashboard');
    }
  }, [usuario, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const auth = getAuth();

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Traer rol info de Firestore
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('No se encontró información del usuario en la base de datos.');
      }
    } catch (err) {
      console.error(err);
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 min-h-screen px-4">
      <form
        onSubmit={handleLogin}
        className="bg-slate-800 p-6 rounded-2xl shadow-xl max-w-md mx-auto mb-8 space-y-4"
        noValidate
      >
        <h2 className="text-3xl font-extrabold text-indigo-300 mb-8 text-center">Iniciar sesión</h2>

        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full p-3 rounded bg-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-3 rounded bg-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="text-red-600 mb-4 text-center font-semibold">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold text-lg transition
            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {loading ? 'Cargando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
