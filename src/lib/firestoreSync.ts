import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query
} from "firebase/firestore";

// Generic helper to fetch collection
export async function fetchCollection(collectionName: string): Promise<any[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    return items;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

// Generic helper to save or update document
export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    // Remove the id from the actual data payload to avoid duplicates
    const { id, ...cleanData } = data;
    await setDoc(docRef, cleanData, { merge: true });
    console.log(`Document ${docId} successfully saved in ${collectionName}`);
  } catch (error) {
    console.error(`Error saving document ${docId} in ${collectionName}:`, error);
    throw error;
  }
}

// Generic helper to delete document
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`Document ${docId} successfully deleted from ${collectionName}`);
  } catch (error) {
    console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
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
    console.error(`Error seeding collection ${collectionName}:`, error);
  }
}
