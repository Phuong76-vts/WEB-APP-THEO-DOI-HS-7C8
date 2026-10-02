import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyDyPU7AUWlolHH8HbCZzlpvG7rQHxOqg-0',
  authDomain: 'web-quan-ly-lop-gvcn.firebaseapp.com',
  projectId: 'web-quan-ly-lop-gvcn',
  storageBucket: 'web-quan-ly-lop-gvcn.firebasestorage.app',
  messagingSenderId: '324909352504',
  appId: '1:324909352504:web:e5052a23261f7d3e7248cd',
  measurementId: 'G-5SC0N3WLJH'
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
