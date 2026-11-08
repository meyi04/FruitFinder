import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/config';

export async function listFavoriteIds(uid: string): Promise<string[]> {
  const snapshots = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snapshots.docs.map((snapshot) => snapshot.id);
}

export async function saveFavorite(uid: string, supplierId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'favorites', supplierId), {
    supplierId,
    createdAt: serverTimestamp(),
  });
}

export async function removeFavorite(uid: string, supplierId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'favorites', supplierId));
}
