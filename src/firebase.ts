import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { OperationType, FirestoreErrorInfo } from './types';

// Precise customer configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAOI2ZPlo7VDH-dophVCnlF3kfBbmPjYbk",
  authDomain: "money-lottery-c7ba4.firebaseapp.com",
  projectId: "money-lottery-c7ba4",
  storageBucket: "money-lottery-c7ba4.firebasestorage.app",
  messagingSenderId: "231245277501",
  appId: "1:231245277501:web:7fc1c97b46322e8c9cbd54",
  measurementId: "G-J313RFN6EP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test-connection-doc', 'test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network status.", error.message);
    }
  }
}
testConnection();

// Standard Firestore Error Helper (mandated by system)
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
