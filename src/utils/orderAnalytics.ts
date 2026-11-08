import type { FruitOrder } from '@/types';

export interface OrderAnalytics {
  orderCount: number;
  pendingCount: number;
  completedCount: number;
  declinedCount: number;
  completedRevenue: number;
  averageCompletedOrder: number;
  buyerCount: number;
  topFruits: { name: string; quantity: number; revenue: number }[];
  dailyRevenue: { date: string; revenue: number; orderCount: number }[];
}

export function summarizeOrders(orders: FruitOrder[]): OrderAnalytics {
  const completed = orders.filter((order) => order.status === 'completed');
  const fruitTotals = new Map<string, { quantity: number; revenue: number }>();
  const dayTotals = new Map<string, { revenue: number; orderCount: number }>();

  for (const order of completed) {
    const date = order.createdAt ? formatReportDate(order.createdAt.toDate()) : '';
    if (date) {
      const daily = dayTotals.get(date) ?? { revenue: 0, orderCount: 0 };
      daily.revenue += order.total;
      daily.orderCount += 1;
      dayTotals.set(date, daily);
    }

    for (const item of order.items) {
      const fruit = fruitTotals.get(item.name) ?? { quantity: 0, revenue: 0 };
      fruit.quantity += item.quantity;
      fruit.revenue += item.subtotal;
      fruitTotals.set(item.name, fruit);
    }
  }

  const completedRevenue = completed.reduce((total, order) => total + order.total, 0);

  return {
    orderCount: orders.length,
    pendingCount: orders.filter((order) => order.status === 'pending').length,
    completedCount: completed.length,
    declinedCount: orders.filter((order) => order.status === 'declined').length,
    completedRevenue,
    averageCompletedOrder: completed.length ? completedRevenue / completed.length : 0,
    buyerCount: new Set(orders.map((order) => order.buyerId)).size,
    topFruits: [...fruitTotals.entries()]
      .map(([name, totals]) => ({ name, ...totals }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    dailyRevenue: [...dayTotals.entries()]
      .map(([date, totals]) => ({ date, ...totals }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function formatReportDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
