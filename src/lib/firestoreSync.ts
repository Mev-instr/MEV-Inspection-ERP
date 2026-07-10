import { app, db, auth, storage, googleProvider } from "./firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  getDoc
} from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Don't throw for list operations to allow offline mode / fallback to initial data
  if (operationType !== OperationType.LIST) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Generic helper to fetch collection
export async function fetchCollection(collectionName: string): Promise<any[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ ...docSnap.data(), id: docSnap.id });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

// Generic helper to save or update document
export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    const { id, ...cleanData } = data;
    await setDoc(docRef, cleanData, { merge: true });
    console.log(`Document ${docId} successfully saved in ${collectionName}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

// Generic helper to delete document
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`Document ${docId} successfully deleted from ${collectionName}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

// Seed helper if Firestore collections are empty on first run
export async function seedFirestore(collectionName: string, initialData: any[]): Promise<void> {
  try {
    console.log(`Seeding collection ${collectionName} with ${initialData.length} records...`);
    const batch = writeBatch(db);
    
    initialData.forEach((item) => {
      const docId = item.id || String(Math.random().toString(36).substring(2, 9));
      const docRef = doc(db, collectionName, docId);
      const { id, ...cleanData } = item;
      batch.set(docRef, cleanData, { merge: true });
    });

    await batch.commit();
    console.log(`Successfully seeded ${collectionName}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `batch-seed/${collectionName}`);
  }
}
