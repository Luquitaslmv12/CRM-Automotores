import PerfilForm from '../components/PerfilForm';
import { useAuth } from '../contexts/AuthContext';

export default function Perfil() {
  const { usuario } = useAuth();

  if (!usuario) {
    return <div className="p-4 text-center">Cargando perfil...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 mt-4">
      <h1 className="text-2xl font-bold mb-4">Mi Perfil</h1>
      <PerfilForm usuario={usuario} />
    </div>
  );
}