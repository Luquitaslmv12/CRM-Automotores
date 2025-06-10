import { useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';

export function useIdleLogout(usuario) {
  useEffect(() => {
    let idleTimer;

    const handleBeforeUnload = () => {
      if (usuario) {
        const auth = getAuth();
        signOut(auth);
      }
    };

    const handleActivity = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        const auth = getAuth();
        signOut(auth);
      }, 4 * 60 * 60 * 1000); // 4hs de inactividad
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);

    handleActivity();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      clearTimeout(idleTimer);
    };
  }, [usuario]);
}
