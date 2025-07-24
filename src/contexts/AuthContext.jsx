import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useIdleLogout } from '../hooks/useIdleLogout';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useIdleLogout(usuario);

  // Función para actualizar el usuario
  const updateUser = async (updates) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Actualizar en Firestore
        const userRef = doc(db, 'usuarios', currentUser.uid);
        await updateDoc(userRef, updates);
        
        // Actualizar en Auth si hay photoURL
        if (updates.photoURL) {
          await updateProfile(currentUser, {
            photoURL: updates.photoURL
          });
        }
        
        // Actualizar estado local
        setUsuario(prev => ({
          ...prev,
          ...updates
        }));
        
        return true;
      }
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
    return false;
  };

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      if (user) {
        // Traer info extra de Firestore
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUsuario({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || null,
            rol: docSnap.data().rol,
            nombre: docSnap.data().nombre || '',
            telefono: docSnap.data().telefono || '',
            ...docSnap.data() // Incluir cualquier otro campo adicional
          });
        } else {
          setUsuario({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || null
          });
        }
      } else {
        setUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}