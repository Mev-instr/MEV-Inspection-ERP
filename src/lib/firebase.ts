import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";
import firebaseAppletConfig from "../../firebase-applet-config.json";

const storageBucket = firebaseAppletConfig.storageBucket || `${firebaseAppletConfig.projectId}.appspot.com`;
console.log("Using storage bucket:", storageBucket);

const firebaseConfig = {
  projectId: firebaseAppletConfig.projectId,
  appId: firebaseAppletConfig.appId,
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  storageBucket: storageBucket,
};

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with experimentalForceLongPolling to avoid connectivity issues in proxy environments
const databaseId = (firebaseAppletConfig as any).databaseId || (firebaseAppletConfig as any).firestoreDatabaseId || "(default)";
console.log("Initializing Firestore with databaseId:", databaseId);

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

// Add a helper to check if we are online
export const isFirestoreOnline = async () => {
  try {
    const { doc, getDocFromServer } = await import("firebase/firestore");
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (e) {
    console.error("Firestore connectivity check failed:", e);
    return false;
  }
};

const auth = getAuth(app);
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

let cachedAccessToken: string | null = localStorage.getItem("gdrive_access_token");
let isSigningIn = false;

// Initialize auth listener
export const initAuth = (
  onAuthChange: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, onAuthChange);
};

export const signInWithGoogle = async () => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google OAuth access token from login");
    }
    cachedAccessToken = credential.accessToken;
    // Save to localStorage as a persistent backup across page reloads and sessions
    localStorage.setItem("gdrive_access_token", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const signOutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem("gdrive_access_token");
};

export const getAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem("gdrive_access_token");
  }
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem("gdrive_access_token", token);
  } else {
    localStorage.removeItem("gdrive_access_token");
  }
};

export { app, db, auth, storage, googleProvider };

