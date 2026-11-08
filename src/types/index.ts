import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'buyer' | 'supplier' | 'admin';
export type AccountStatus = 'active' | 'suspended';
export type FruitUnit = 'kg' | 'piece' | 'box';
export type OrderType = 'retail' | 'bulk' | 'events';

export const FRUIT_CATEGORIES = ['Tropical', 'Citrus', 'Berries', 'Seasonal', 'Other'] as const;
export type FruitCategory = (typeof FRUIT_CATEGORIES)[number];

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status?: AccountStatus;
  phone: string;
  municipality: string;
  barangay: string;
  createdAt: Timestamp;
}

export interface Supplier {
  id: string;
  businessName: string;
  description: string;
  address: string;
  municipality: string;
  barangay: string;
  phone: string;
  facebookLink: string;
  orderTypes: OrderType[];
  categories: string[];
  avgRating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface FruitListing {
  id: string;
  name: string;
  category: FruitCategory;
  price: number;
  unit: FruitUnit;
  inStock: boolean;
  minBulkQty: number;
  description: string;
  imageUrl: string;
  imageBase64?: string;
  createdAt: Timestamp;
}

export interface SupplierReview {
  id: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

export type OrderStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export interface OrderItem {
  fruitId: string;
  name: string;
  price: number;
  unit: FruitUnit;
  quantity: number;
  subtotal: number;
}

export interface FruitOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  total: number;
  orderType: OrderType;
  note: string;
  status: OrderStatus;
  conversationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Conversation {
  id: string;
  supplierId: string;
  buyerId: string;
  supplierName: string;
  buyerName: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp;
}

export interface SupplierFilters {
  search: string;
  municipality: string;
  barangay: string;
  category: string;
  orderType: OrderType | '';
}
