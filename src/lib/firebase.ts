import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  // @ts-ignore
  getReactNativePersistence,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const cleanEnv = (val?: string) => (!val || val.includes('your-') ? '' : val);

export const firebaseConfig = {
  apiKey: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_API_KEY) || "AIzaSyBVF57PV6VcYT5Bz_2RCnQtn_6OwKsMrus",
  authDomain: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN) || "utsavhub-71407.firebaseapp.com",
  projectId: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) || "utsavhub-71407",
  storageBucket: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET) || "utsavhub-71407.firebasestorage.app",
  messagingSenderId: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "567922322355",
  appId: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_APP_ID) || "1:567922322355:web:fb0a0e90f3fbcc270bf9c6",
  measurementId: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID) || "G-613BCE0G4B"
};

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;

try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    // For Native React Native: initialize with AsyncStorage persistence if not already initialized
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      auth = getAuth(app);
    }
  }
} catch (err) {
  auth = getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { 
  app, 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  ConfirmationResult 
};
export default app;
