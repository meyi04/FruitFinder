import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/config';
import { getConversationId } from '@/services/orderService';
import type { ChatMessage, Conversation, Supplier, UserProfile } from '@/types';

export async function startConversation(supplier: Supplier, buyer: UserProfile): Promise<string> {
  if (buyer.role !== 'buyer') throw new Error('Only buyer accounts can start a supplier conversation.');
  if (supplier.id === buyer.uid) throw new Error('You cannot start a conversation with your own store.');

  const conversationId = getConversationId(supplier.id, buyer.uid);
  const conversationRef = doc(db, 'conversations', conversationId);
  const existing = await getDoc(conversationRef);

  if (existing.exists()) {
    const data = existing.data();
    if (data.buyerId !== buyer.uid || data.supplierId !== supplier.id) {
      throw new Error('This conversation is not available.');
    }
    return conversationId;
  }

  await setDoc(conversationRef, {
    buyerId: buyer.uid,
    buyerName: buyer.name,
    supplierId: supplier.id,
    supplierName: supplier.businessName,
    participantIds: [buyer.uid, supplier.id],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return conversationId;
}

export async function listConversations(uid: string): Promise<Conversation[]> {
  const snapshots = await getDocs(
    query(collection(db, 'conversations'), where('participantIds', 'array-contains', uid)),
  );
  return snapshots.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as Conversation)
    .sort((a, b) => (b.lastMessageAt?.toMillis() ?? 0) - (a.lastMessageAt?.toMillis() ?? 0));
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const snapshot = await getDoc(doc(db, 'conversations', conversationId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Conversation) : null;
}

export function subscribeToMessages(
  conversationId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void,
): () => void {
  const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onMessages(snapshot.docs.map((message) => ({ id: message.id, ...message.data() }) as ChatMessage));
    },
    onError,
  );
}

export async function sendMessage(conversation: Conversation, sender: UserProfile, text: string): Promise<void> {
  const messageText = text.trim();
  if (!messageText) throw new Error('Write a message before sending.');
  if (messageText.length > 2000) throw new Error('Messages must be 2,000 characters or less.');
  if (!conversation.participantIds.includes(sender.uid)) throw new Error('You cannot message this conversation.');

  const conversationRef = doc(db, 'conversations', conversation.id);
  const messageRef = doc(collection(conversationRef, 'messages'));
  const batch = writeBatch(db);
  batch.set(messageRef, {
    senderId: sender.uid,
    senderName: sender.name,
    text: messageText,
    createdAt: serverTimestamp(),
  });
  batch.update(conversationRef, {
    lastMessage: messageText,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
