import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

import { Mail, Lock, User, UserCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('user');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: nombre });

      await setDoc(doc(db, 'usuarios', user.uid), {
        rol,
        nombre,
        email,
      });

      toast.success('Usuario creado correctamente: ' + user.email);

      setEmail('');
      setPassword('');
      setRol('user');
      setNombre('');
    } catch (error) {
      toast.error('Error: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Animaciones framer motion para el botón
  const buttonVariants = {
    idle: { scale: 1 },
    loading: { scale: 0.95, opacity: 0.7 },
    hover: { scale: 1.05 },
  };

  return (
    <div className='p-20'>
    <motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="max-w-md mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20"
>
  <h2 className="text-3xl font-extrabold mb-8 text-center text-white tracking-wide">
    Panel de Admin
  </h2>
  <form onSubmit={handleCrearUsuario} noValidate className="space-y-6 text-white">
    {/* Nombre */}
    <div className="relative">
      <User className="absolute left-3 top-3 text-white/80" />
      <input
        type="text"
        placeholder="Nombre"
        className="w-full pl-10 pr-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-white/60 transition"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        disabled={loading}
      />
    </div>

    {/* Email */}
    <div className="relative">
      <Mail className="absolute left-3 top-3 text-white/80" />
      <input
        type="email"
        placeholder="Correo electrónico"
        className="w-full pl-10 pr-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-white/60 transition"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />
    </div>

    {/* Password */}
    <div className="relative">
  <Lock className="absolute left-3 top-3 text-white/80" />
  <input
    type={showPassword ? 'text' : 'password'}
    placeholder="Contraseña"
    className="w-full pl-10 pr-10 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-white/60 transition"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    minLength={6}
    disabled={loading}
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-3 text-white/70 hover:text-black/80 transition"
    tabIndex={-1} // evita que el botón entre en el tab loop
  >
    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>
</div>

    {/* Rol */}
    <div className="relative">
      <UserCheck className="absolute left-3 top-3 text-white/80" />
      <select
        className="w-full pl-10 pr-4 py-3 bg-white/10 text-black border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition appearance-none"
        value={rol}
        onChange={(e) => setRol(e.target.value)}
        disabled={loading}
      >
        <option value="user">Usuario</option>
        <option value="admin">Admin</option>
        <option value="vendedor">Vendedor</option>
      </select>
    </div>

    {/* Botón */}
    <motion.button
      type="submit"
      disabled={loading}
      variants={buttonVariants}
      initial="idle"
      animate={loading ? 'loading' : 'idle'}
      whileHover={!loading ? 'hover' : ''}
      className="w-full py-3 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 text-white font-semibold rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {loading ? 'Creando...' : 'Crear Usuario'}
    </motion.button>
  </form>
</motion.div>
    </div>
  );
}
