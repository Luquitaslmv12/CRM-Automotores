/* import { initializeApp } from 'firebase/app';
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
 */


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFUApKbviOz4WaIuqV66Q_BPQhreV_i5Y",
  authDomain: "crm-latortuga-3c9dd.firebaseapp.com",
  projectId: "crm-latortuga-3c9dd",
  storageBucket: "crm-latortuga-3c9dd.firebasestorage.app",
  messagingSenderId: "1008954752263",
  appId: "1:1008954752263:web:d6ba8d65da781045fbd9a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;