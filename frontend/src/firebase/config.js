import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Validate configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration fields:', missingFields);
  throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
}

// Debug: Log config to ensure environment variables are loaded
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? '✅ Loaded' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Loaded' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Loaded' : '❌ Missing',
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore conditionally
let db: Firestore | null = null;
let firestoreAvailable = false;

// Only initialize Firestore if explicitly enabled
if (process.env.REACT_APP_ENABLE_FIRESTORE === 'true') {
  try {
    db = getFirestore(app);
    firestoreAvailable = true;
    console.log('✅ Firestore initialized');
    
    // Test Firestore connection
    if (process.env.NODE_ENV === 'development') {
      import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
        // Only connect to emulator if explicitly configured
        if (process.env.REACT_APP_USE_FIRESTORE_EMULATOR === 'true') {
          try {
            connectFirestoreEmulator(db, 'localhost', 8080);
            console.log('Connected to Firestore Emulator');
          } catch (error) {
            console.log('Firestore Emulator connection failed:', error);
          }
        }
      });
    }
  } catch (error) {
    console.warn('⚠️ Firestore initialization failed:', error);
    db = null;
    firestoreAvailable = false;
  }
} else {
  console.log('ℹ️ Firestore disabled - running in auth-only mode');
}

export { db, firestoreAvailable };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;