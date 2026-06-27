import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getStorage } from "firebase/storage";
import firebaseAppletConfig from "../../firebase-applet-config.json";

const firebaseConfig = {
  projectId: firebaseAppletConfig.projectId,
  appId: firebaseAppletConfig.appId,
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  storageBucket: firebaseAppletConfig.storageBucket,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, (firebaseAppletConfig as any).firestoreDatabaseId || "(default)");
const auth = getAuth(app);
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might have expired or not present in cache.
        // In full-stack context, the user might need to re-login to get a fresh token.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
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

