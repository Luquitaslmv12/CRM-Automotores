import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBJdKJP9OrnMab9HHDfaSLvxjUD_tnpNhI",
  authDomain: "crm-agencia-3e23c.firebaseapp.com",
  projectId: "crm-agencia-3e23c",
  storageBucket: "crm-agencia-3e23c.firebasestorage.app",
  messagingSenderId: "715486289396",
  appId: "1:715486289396:web:5f97279d92a04e67e16da1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;