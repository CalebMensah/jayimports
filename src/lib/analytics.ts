import type { SupabaseClient } from "@supabase/supabase-js";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAnalytics(supabase: SupabaseClient) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const thirtyDaysAgo = daysAgo(30);

  // --- Orders (paid + all, for revenue and funnel) ---
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, total, status, payment_status, created_at, customer_id");

  const orders = allOrders ?? [];
  const paidOrders = orders.filter((o) => o.payment_status === "paid");

  // Revenue
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const thisMonthRevenue = paidOrders
    .filter((o) => new Date(o.created_at) >= thisMonthStart)
    .reduce((sum, o) => sum + Number(o.total), 0);
  const lastMonthRevenue = paidOrders
    .filter((o) => new Date(o.created_at) >= lastMonthStart && new Date(o.created_at) < thisMonthStart)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const revenueChangePercent =
    lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0
        ? 100
        : 0;

  const totalOrders = orders.length;
  const thisMonthOrders = orders.filter((o) => new Date(o.created_at) >= thisMonthStart).length;
  const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Order funnel — counts by status
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const paymentStatusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.payment_status] = (acc[o.payment_status] ?? 0) + 1;
    return acc;
  }, {});

  const cancelledCount = statusCounts["cancelled"] ?? 0;
  const cancellationRate = totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0;

  // Revenue trend — last 30 days, daily
  const dailyRevenueMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i);
    dailyRevenueMap.set(d.toISOString().slice(0, 10), 0);
  }
  paidOrders
    .filter((o) => new Date(o.created_at) >= thirtyDaysAgo)
    .forEach((o) => {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      if (dailyRevenueMap.has(key)) {
        dailyRevenueMap.set(key, (dailyRevenueMap.get(key) ?? 0) + Number(o.total));
      }
    });
  const revenueTrend = Array.from(dailyRevenueMap.entries()).map(([date, revenue]) => ({
    date: new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    revenue,
  }));

  // --- Order items — best sellers (only from paid orders) ---
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity, line_total, order_id");

  const relevantItems = (orderItems ?? []).filter((i) => paidOrderIds.has(i.order_id));

  const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();
  relevantItems.forEach((item) => {
    const existing = productStats.get(item.product_id) ?? { name: item.product_name, quantity: 0, revenue: 0 };
    existing.quantity += item.quantity;
    existing.revenue += Number(item.line_total);
    productStats.set(item.product_id, existing);
  });

  const bestSellersByQuantity = Array.from(productStats.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const bestSellersByRevenue = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // --- Products — preorder split + low stock ---
  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock_quantity, is_preorder")
    .neq("status", "archived");

  const preorderCount = products?.filter((p) => p.is_preorder).length ?? 0;
  const inStockCount = products?.filter((p) => !p.is_preorder).length ?? 0;
  const lowStockProducts = products?.filter((p) => !p.is_preorder && p.stock_quantity <= 3) ?? [];

  // --- Customers — new vs returning ---
  const customerOrderCounts = new Map<string, number>();
  orders.forEach((o) => {
    customerOrderCounts.set(o.customer_id, (customerOrderCounts.get(o.customer_id) ?? 0) + 1);
  });
  const totalCustomers = customerOrderCounts.size;
  const returningCustomers = Array.from(customerOrderCounts.values()).filter((c) => c > 1).length;
  const newCustomers = totalCustomers - returningCustomers;

  return {
    totalRevenue,
    thisMonthRevenue,
    revenueChangePercent,
    totalOrders,
    thisMonthOrders,
    averageOrderValue,
    statusCounts,
    paymentStatusCounts,
    cancellationRate,
    revenueTrend,
    bestSellersByQuantity,
    bestSellersByRevenue,
    preorderCount,
    inStockCount,
    lowStockProducts,
    totalCustomers,
    newCustomers,
    returningCustomers,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;