import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { FruitOrder } from '@/types';
import { formatReportDate, summarizeOrders } from '@/utils/orderAnalytics';

function order(overrides: Partial<FruitOrder> = {}): FruitOrder {
  return {
    id: 'order-1',
    supplierId: 'supplier-1',
    supplierName: 'Local Fruits',
    buyerId: 'buyer-1',
    buyerName: 'Buyer',
    items: [{ fruitId: 'mango', name: 'Mango', price: 100, unit: 'kg', quantity: 2, subtotal: 200 }],
    total: 200,
    orderType: 'retail',
    note: '',
    status: 'completed',
    conversationId: 'supplier-1_buyer-1',
    createdAt: Timestamp.fromDate(new Date(2026, 10, 8, 12)),
    updatedAt: Timestamp.fromDate(new Date(2026, 10, 8, 12)),
    ...overrides,
  };
}

describe('supplier order analytics', () => {
  it('counts completed revenue separately from pending orders', () => {
    const report = summarizeOrders([
      order(),
      order({
        id: 'order-2',
        status: 'pending',
        buyerId: 'buyer-2',
        total: 500,
      }),
    ]);

    expect(report.orderCount).toBe(2);
    expect(report.completedCount).toBe(1);
    expect(report.pendingCount).toBe(1);
    expect(report.completedRevenue).toBe(200);
    expect(report.averageCompletedOrder).toBe(200);
    expect(report.buyerCount).toBe(2);
  });

  it('aggregates completed sales by fruit and local calendar date', () => {
    const report = summarizeOrders([
      order(),
      order({
        id: 'order-2',
        items: [{ fruitId: 'mango', name: 'Mango', price: 100, unit: 'kg', quantity: 1, subtotal: 100 }],
        total: 100,
        createdAt: Timestamp.fromDate(new Date(2026, 10, 8, 16)),
      }),
    ]);

    expect(report.topFruits).toEqual([{ name: 'Mango', quantity: 3, revenue: 300 }]);
    expect(report.dailyRevenue).toEqual([{ date: '2026-11-08', revenue: 300, orderCount: 2 }]);
  });

  it('formats date inputs using the local calendar date', () => {
    expect(formatReportDate(new Date(2026, 10, 8))).toBe('2026-11-08');
  });
});
