import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAE12tYEAEmReCOuA38jNmrqR5ksF2tyCw",
  authDomain: "web-gvcn-quan-ly-hs-vts.firebaseapp.com",
  projectId: "web-gvcn-quan-ly-hs-vts",
  storageBucket: "web-gvcn-quan-ly-hs-vts.firebasestorage.app",
  messagingSenderId: "344898516435",
  appId: "1:344898516435:web:6c8ad68f9410b7b8862b26",
  measurementId: "G-NY6J305VX0"
};
export const firebaseApp = getApps().some(app => app.name === '[DEFAULT]') ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
// Emulator use is opt-in for local verification only.
if ((import.meta as any).env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
