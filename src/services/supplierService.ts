import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/firebase/config';
import type { Supplier, SupplierFilters } from '@/types';

export type SupplierProfileInput = Pick<
  Supplier,
  | 'businessName'
  | 'description'
  | 'address'
  | 'municipality'
  | 'barangay'
  | 'phone'
  | 'facebookLink'
  | 'orderTypes'
  | 'categories'
  | 'isActive'
>;

export async function listSuppliers(filters: Partial<SupplierFilters> = {}): Promise<Supplier[]> {
  const [snapshots, reviewSnapshots] = await Promise.all([
    getDocs(collection(db, 'suppliers')),
    getDocs(collectionGroup(db, 'reviews')),
  ]);
  const reviewTotals = new Map<string, { count: number; total: number }>();
  for (const review of reviewSnapshots.docs) {
    const supplierId = review.ref.parent.parent?.id;
    const rating = Number(review.data().rating);
    if (!supplierId || !Number.isFinite(rating)) continue;
    const total = reviewTotals.get(supplierId) ?? { count: 0, total: 0 };
    total.count += 1;
    total.total += rating;
    reviewTotals.set(supplierId, total);
  }
  const suppliers = snapshots.docs
    .map((snapshot) => {
      const supplier = { id: snapshot.id, ...snapshot.data() } as Supplier;
      const totals = reviewTotals.get(snapshot.id);
      return {
        ...supplier,
        avgRating: totals ? totals.total / totals.count : 0,
        reviewCount: totals?.count ?? 0,
      };
    })
    .filter((supplier) => supplier.isActive !== false);
  const search = filters.search?.trim().toLowerCase();
  const category = filters.category;
  const matchingFruitSuppliers = new Set<string>();

  if (search || category) {
    const fruitSnapshots = await getDocs(collectionGroup(db, 'fruits'));
    for (const fruit of fruitSnapshots.docs) {
      const data = fruit.data();
      const matchesSearch =
        !search ||
        String(data.name || '')
          .toLowerCase()
          .includes(search);
      const matchesCategory = !category || data.category === category;
      const supplierId = fruit.ref.parent.parent?.id;
      if (matchesSearch && matchesCategory && supplierId) matchingFruitSuppliers.add(supplierId);
    }
  }

  return suppliers.filter((supplier) => {
    const matchesSearch =
      !search ||
      [supplier.businessName, supplier.description, supplier.municipality, supplier.barangay]
        .join(' ')
        .toLowerCase()
        .includes(search) ||
      matchingFruitSuppliers.has(supplier.id);
    const matchesCategory =
      !category || supplier.categories?.includes(category) || matchingFruitSuppliers.has(supplier.id);
    return (
      matchesSearch &&
      (!filters.municipality || supplier.municipality === filters.municipality) &&
      (!filters.barangay || supplier.barangay === filters.barangay) &&
      matchesCategory &&
      (!filters.orderType || supplier.orderTypes?.includes(filters.orderType))
    );
  });
}

export async function getSupplier(supplierId: string): Promise<Supplier | null> {
  const snapshot = await getDoc(doc(db, 'suppliers', supplierId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Supplier) : null;
}

export async function saveSupplierProfile(uid: string, input: SupplierProfileInput): Promise<void> {
  const reference = doc(db, 'suppliers', uid);
  const existing = await getDoc(reference);
  if (existing.exists()) {
    await updateDoc(reference, input);
  } else {
    await setDoc(reference, { ...input, avgRating: 0, reviewCount: 0, createdAt: serverTimestamp() });
  }
}
