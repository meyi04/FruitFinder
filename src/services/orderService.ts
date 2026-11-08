import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '@/firebase/config';
import type { FruitOrder, OrderItem, OrderStatus, OrderType, UserProfile } from '@/types';

export function getConversationId(supplierId: string, buyerId: string): string {
  return `${supplierId}_${buyerId}`;
}

export async function createOrder(input: {
  supplierId: string;
  supplierName: string;
  buyer: UserProfile;
  items: OrderItem[];
  orderType: OrderType;
  note: string;
}): Promise<{ orderId: string; conversationId: string }> {
  if (input.buyer.role !== 'buyer') throw new Error('Only buyer accounts can place orders.');
  if (!input.items.length) throw new Error('Add at least one fruit to your order.');
  if (input.items.length > 30) throw new Error('An order can include up to 30 different fruit listings.');
  if (input.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new Error('Order quantities must be whole numbers greater than zero.');
  }
  if (
    input.items.some(
      (item) =>
        !item.fruitId ||
        !item.name.trim() ||
        !Number.isFinite(item.price) ||
        item.price <= 0 ||
        !Number.isFinite(item.subtotal) ||
        item.subtotal !== Math.round(item.price * item.quantity * 100) / 100,
    )
  ) {
    throw new Error('One or more order items have invalid pricing.');
  }

  const total = input.items.reduce((sum, item) => sum + item.subtotal, 0);
  if (!Number.isFinite(total) || total <= 0) throw new Error('This order has an invalid total.');

  const conversationId = getConversationId(input.supplierId, input.buyer.uid);
  const orderRef = doc(collection(db, 'orders'));
  const conversationRef = doc(db, 'conversations', conversationId);
  const messageRef = doc(collection(conversationRef, 'messages'));
  const batch = writeBatch(db);
  const existingConversation = await getDoc(conversationRef);

  batch.set(orderRef, {
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    buyerId: input.buyer.uid,
    buyerName: input.buyer.name,
    items: input.items,
    total,
    orderType: input.orderType,
    note: input.note.trim(),
    status: 'pending',
    conversationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (existingConversation.exists()) {
    const conversation = existingConversation.data();
    if (conversation.buyerId !== input.buyer.uid || conversation.supplierId !== input.supplierId) {
      throw new Error('This supplier conversation is not available.');
    }
    batch.update(conversationRef, {
      lastMessage: `Order request sent · ₱${total.toFixed(2)}`,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(conversationRef, {
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      buyerId: input.buyer.uid,
      buyerName: input.buyer.name,
      participantIds: [input.supplierId, input.buyer.uid],
      lastMessage: `Order request sent · ₱${total.toFixed(2)}`,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  batch.set(messageRef, {
    senderId: input.buyer.uid,
    senderName: input.buyer.name,
    text: `Order request sent · ₱${total.toFixed(2)}`,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return { orderId: orderRef.id, conversationId };
}

export async function listOrders(
  uid: string,
  role: UserProfile['role'],
  dateRange?: { startDate?: string; endDate?: string },
): Promise<FruitOrder[]> {
  const field = role === 'buyer' ? 'buyerId' : 'supplierId';
  const constraints: QueryConstraint[] = [where(field, '==', uid)];
  if (dateRange?.startDate) {
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(new Date(`${dateRange.startDate}T00:00:00`))));
  }
  if (dateRange?.endDate) {
    const dayAfterEnd = new Date(`${dateRange.endDate}T00:00:00`);
    dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
    constraints.push(where('createdAt', '<', Timestamp.fromDate(dayAfterEnd)));
  }
  const snapshots = await getDocs(query(collection(db, 'orders'), ...constraints));
  return snapshots.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as FruitOrder)
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}
