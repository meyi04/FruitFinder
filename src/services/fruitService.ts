import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/config';
import type { FruitListing } from '@/types';

export type FruitInput = Omit<FruitListing, 'id' | 'createdAt'>;

export async function listFruits(supplierId: string): Promise<FruitListing[]> {
  const snapshots = await getDocs(collection(db, 'suppliers', supplierId, 'fruits'));
  return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as FruitListing);
}

export async function createFruit(supplierId: string, input: FruitInput): Promise<void> {
  await addDoc(collection(db, 'suppliers', supplierId, 'fruits'), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function updateFruit(supplierId: string, fruitId: string, input: FruitInput): Promise<void> {
  await updateDoc(doc(db, 'suppliers', supplierId, 'fruits', fruitId), input);
}

export async function deleteFruit(supplierId: string, fruitId: string): Promise<void> {
  await deleteDoc(doc(db, 'suppliers', supplierId, 'fruits', fruitId));
}
