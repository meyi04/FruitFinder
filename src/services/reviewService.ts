import { collection, doc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';

import { db } from '@/firebase/config';
import type { SupplierReview, UserProfile } from '@/types';

export async function listReviews(supplierId: string): Promise<SupplierReview[]> {
  const snapshots = await getDocs(collection(db, 'suppliers', supplierId, 'reviews'));
  return snapshots.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as SupplierReview)
    .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
}

export async function createReview(
  supplierId: string,
  buyer: UserProfile,
  rating: number,
  comment: string,
): Promise<void> {
  const reviewRef = doc(db, 'suppliers', supplierId, 'reviews', buyer.uid);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reviewRef);
    if (existing.exists()) throw new Error('You have already reviewed this supplier.');
    transaction.set(reviewRef, {
      buyerId: buyer.uid,
      buyerName: buyer.name,
      rating,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    });
  });
}
