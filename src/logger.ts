import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ErrorLogData {
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  userName?: string;
}

export const logErrorToFirestore = async (errorData: ErrorLogData) => {
  try {
    const currentUser = auth.currentUser;
    const logData = {
      ...errorData,
      userId: errorData.userId || currentUser?.uid || 'anonymous',
      userName: errorData.userName || currentUser?.displayName || 'Anonymous',
      url: errorData.url || window.location.href,
      userAgent: errorData.userAgent || navigator.userAgent,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, 'error_logs'), logData);
  } catch (err) {
    // Fallback to console if Firestore logging fails
    console.error('Failed to log error to Firestore:', err);
  }
};
