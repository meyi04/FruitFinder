import { collection, doc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';

import { db } from '@/firebase/config';
import type { AccountStatus, FruitOrder, Supplier, UserProfile } from '@/types';

export async function listManagedUsers(): Promise<UserProfile[]> {
  const snapshots = await getDocs(collection(db, 'users'));
  return snapshots.docs.map((snapshot) => ({ uid: snapshot.id, ...snapshot.data() }) as UserProfile);
}

export async function listManagedSuppliers(): Promise<Supplier[]> {
  const snapshots = await getDocs(collection(db, 'suppliers'));
  return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as Supplier);
}

export async function listAdminOrders(startDate: string, endDate: string): Promise<FruitOrder[]> {
  const start = Timestamp.fromDate(new Date(`${startDate}T00:00:00`));
  const dayAfterEnd = new Date(`${endDate}T00:00:00`);
  dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
  const snapshots = await getDocs(
    query(
      collection(db, 'orders'),
      where('createdAt', '>=', start),
      where('createdAt', '<', Timestamp.fromDate(dayAfterEnd)),
    ),
  );
  return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as FruitOrder);
}

export async function updateManagedUser(
  uid: string,
  changes: Pick<UserProfile, 'name' | 'phone' | 'municipality' | 'barangay'>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), changes);
}

export async function setManagedUserStatus(uid: string, status: AccountStatus): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status });
}
