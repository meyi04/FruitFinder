import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { FruitOrder, Supplier, UserProfile } from '@/types';
import { summarizeAdminData } from '@/utils/adminAnalytics';

function order(overrides: Partial<FruitOrder> = {}): FruitOrder {
  return {
    id: 'order-1',
    supplierId: 'supplier-1',
    supplierName: 'Mango Grove',
    buyerId: 'buyer-1',
    buyerName: 'Buyer One',
    items: [],
    total: 250,
    orderType: 'retail',
    note: '',
    status: 'completed',
    conversationId: 'supplier-1_buyer-1',
    createdAt: Timestamp.fromDate(new Date(2026, 10, 8, 12)),
    updatedAt: Timestamp.fromDate(new Date(2026, 10, 8, 12)),
    ...overrides,
  };
}

describe('admin analytics', () => {
  it('summarizes members, suppliers, and completed sales in the selected orders', () => {
    const users = [
      { uid: 'buyer-1', role: 'buyer', status: 'active' },
      { uid: 'buyer-2', role: 'buyer', status: 'suspended' },
      { uid: 'supplier-1', role: 'supplier', status: 'active' },
    ] as UserProfile[];
    const suppliers = [
      { id: 'supplier-1', isActive: true },
      { id: 'supplier-2', isActive: false },
    ] as Supplier[];
    const report = summarizeAdminData(users, suppliers, [
      order(),
      order({ id: 'order-2', buyerId: 'buyer-2', total: 50 }),
      order({ id: 'order-3', status: 'pending', total: 900 }),
    ]);

    expect(report.userCount).toBe(3);
    expect(report.buyerCount).toBe(2);
    expect(report.suspendedCount).toBe(1);
    expect(report.supplierCount).toBe(2);
    expect(report.activeSupplierCount).toBe(1);
    expect(report.orderCount).toBe(3);
    expect(report.completedCount).toBe(2);
    expect(report.pendingCount).toBe(1);
    expect(report.completedRevenue).toBe(300);
    expect(report.customerCount).toBe(2);
    expect(report.topSuppliers).toEqual([{ supplierId: 'supplier-1', name: 'Mango Grove', revenue: 300, orders: 2 }]);
  });
});
