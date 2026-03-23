import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Utility to remove undefined values from objects before saving to Firestore
export const sanitizeData = (data: any): any => {
  if (data === null || typeof data !== 'object') return data;
  
  const sanitized: any = Array.isArray(data) ? [] : {};
  
  for (const key in data) {
    if (data[key] !== undefined) {
      sanitized[key] = sanitizeData(data[key]);
    }
  }
  
  return sanitized;
};

export default app;
