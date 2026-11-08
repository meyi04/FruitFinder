import type { FruitOrder, Supplier, UserProfile } from '@/types';
import { formatReportDate } from '@/utils/orderAnalytics';

export interface AdminAnalytics {
  userCount: number;
  buyerCount: number;
  supplierAccountCount: number;
  suspendedCount: number;
  supplierCount: number;
  activeSupplierCount: number;
  orderCount: number;
  pendingCount: number;
  completedCount: number;
  completedRevenue: number;
  customerCount: number;
  dailyRevenue: { date: string; revenue: number }[];
  topSuppliers: { supplierId: string; name: string; revenue: number; orders: number }[];
}

export function summarizeAdminData(users: UserProfile[], suppliers: Supplier[], orders: FruitOrder[]): AdminAnalytics {
  const completed = orders.filter((order) => order.status === 'completed');
  const dailyTotals = new Map<string, number>();
  const supplierTotals = new Map<string, { name: string; revenue: number; orders: number }>();

  for (const order of completed) {
    if (order.createdAt) {
      const date = formatReportDate(order.createdAt.toDate());
      dailyTotals.set(date, (dailyTotals.get(date) ?? 0) + order.total);
    }

    const totals = supplierTotals.get(order.supplierId) ?? {
      name: order.supplierName,
      revenue: 0,
      orders: 0,
    };
    totals.revenue += order.total;
    totals.orders += 1;
    supplierTotals.set(order.supplierId, totals);
  }

  return {
    userCount: users.length,
    buyerCount: users.filter((user) => user.role === 'buyer').length,
    supplierAccountCount: users.filter((user) => user.role === 'supplier').length,
    suspendedCount: users.filter((user) => user.status === 'suspended').length,
    supplierCount: suppliers.length,
    activeSupplierCount: suppliers.filter((supplier) => supplier.isActive !== false).length,
    orderCount: orders.length,
    pendingCount: orders.filter((order) => order.status === 'pending').length,
    completedCount: completed.length,
    completedRevenue: completed.reduce((total, order) => total + order.total, 0),
    customerCount: new Set(orders.map((order) => order.buyerId)).size,
    dailyRevenue: [...dailyTotals.entries()]
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topSuppliers: [...supplierTotals.entries()]
      .map(([supplierId, totals]) => ({ supplierId, ...totals }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  };
}
