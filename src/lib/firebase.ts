import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
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

// Removed App Check temporarily

const databaseId = (firebaseAppletConfig as any).databaseId || (firebaseAppletConfig as any).firestoreDatabaseId || "(default)";
console.log("Initializing Firestore with databaseId:", databaseId);

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, databaseId);

const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

let cachedAccessToken: string | null = localStorage.getItem("gdrive_access_token");
let isSigningIn = false;

// Domain validation
const ALLOWED_ERP_DOMAINS = ['erp.mev-ins.com', 'localhost', 'ais-dev', 'ais-pre', window.location.hostname];

export const signInWithGoogle = async () => {
  try {
    isSigningIn = true;
    const { signInWithPopup } = await import("firebase/auth");
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

// Add a helper to check if we are online
export const isFirestoreOnline = async () => {
  try {
    const { collection, getDocs, limit, query } = await import("firebase/firestore");
    await getDocs(query(collection(db, 'users'), limit(1)));
    return true;
  } catch (e) {
    console.error("Firestore connectivity check failed:", e);
    return false;
  }
};

// Secure auth state listener with role + domain validation
export const initSecureAuth = (
  onAuthChange: (user: User | null, role: string | null) => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onAuthChange(null, null);
      return;
    }

    try {
      // Bypass check for admin
      if (user.email === "shahzaibkamran44@gmail.com") {
        // Ensure the admin doc exists
        const { getDoc, setDoc, doc } = await import("firebase/firestore");
        const adminDoc = await getDoc(doc(db, 'users', user.uid));
        if (!adminDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            role: 'admin',
            name: 'Shahzaib Kamran (Admin)',
            createdAt: new Date()
          });
        }
        onAuthChange(user, "admin");
        return;
      }



      // Domain check (client-side enforcement as backup to server-side rules)
      const currentDomain = window.location.hostname;
      if (!ALLOWED_ERP_DOMAINS.some(d => currentDomain.includes(d))) {
        await signOut(auth);
        onAuthChange(null, null);
        throw new Error(`Domain ${currentDomain} not authorized for ERP access.`);
      }

      // Validate user exists in Firestore users collection
      const { getDoc, doc } = await import("firebase/firestore");
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        onAuthChange(null, null);
        throw new Error('User not found in system. Contact admin.');
      }

      const userData = userDoc.data();
      const role = userData.role || 'pending';
      if (!role || role === 'pending') {
        await signOut(auth);
        onAuthChange(null, null);
        throw new Error('Account pending admin approval. Contact your administrator.');
      }

      if (userData.disabled === true) {
        await signOut(auth);
        onAuthChange(null, null);
        throw new Error('Account disabled. Contact admin.');
      }

      onAuthChange(user, role);
    } catch (err: any) {
      console.error('Auth validation error:', err);
      onAuthChange(null, null);
    }
  });
};

export { app, db, auth, storage, functions, googleProvider };
