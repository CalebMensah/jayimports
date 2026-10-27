import type { SupabaseClient } from "@supabase/supabase-js";
import { ITEM_FIELDS, NO_OPTIONS, itemLabel, type RawItem } from "@/lib/batch-item";

export type RawOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  customer: { full_name: string; phone: string } | { full_name: string; phone: string }[] | null;
  order_items: RawItem[] | null;
};

export type BatchOrderLine = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  label: string;
  quantity: number;
  amount: number;
  status: string;
  paymentStatus: string;
  counted: boolean;
};

export type ProductGroup = {
  key: string;
  name: string;
  image: string | null;
  quantity: number;
  orderCount: number;
  revenue: number;
  variants: { label: string; quantity: number }[];
  lines: BatchOrderLine[];
};

export type BatchSummary = {
  groups: ProductGroup[];
  orderCount: number;
  totalQuantity: number;
  totalRevenue: number;
  hiddenOrders: number;
};

const ORDER_SELECT = `id, order_number, status, payment_status, created_at, customer:customers(full_name, phone), order_items(${ITEM_FIELDS})`;
const CHUNK = 1000;

/** Every order in a batch (batchId null = orders waiting for the next batch) */
export async function getBatchOrders(
  supabase: SupabaseClient,
  batchId: string | null
): Promise<{ orders: RawOrder[]; failed: boolean }> {
  const orders: RawOrder[] = [];

  for (let from = 0; ; from += CHUNK) {
    const base = supabase.from("orders").select(ORDER_SELECT);
    const filtered = batchId ? base.eq("batch_id", batchId) : base.is("batch_id", null);

    const { data, error } = await filtered
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + CHUNK - 1);

    if (error) {
      console.error("BATCH ORDERS ERROR:", error.message);
      return { orders, failed: true };
    }

    const rows = (data ?? []) as unknown as RawOrder[];
    orders.push(...rows);
    if (rows.length < CHUNK) break;
  }

  return { orders, failed: false };
}

type Working = ProductGroup & {
  orderIds: Set<string>;
  variantMap: Map<string, number>;
};

/**
 * Groups order lines by product. Only paid, non-cancelled orders count towards the totals.
 * With includeAll, the other orders are listed too (dimmed) but still not counted.
 */
export function groupByProduct(orders: RawOrder[], includeAll: boolean): BatchSummary {
  const map = new Map<string, Working>();
  const countedOrderIds = new Set<string>();
  let hiddenOrders = 0;
  let totalQuantity = 0;
  let totalRevenue = 0;

  for (const order of orders) {
    const counted = order.payment_status === "paid" && order.status !== "cancelled";
    if (!counted && !includeAll) {
      hiddenOrders += 1;
      continue;
    }
    if (counted) countedOrderIds.add(order.id);

    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer;

    for (const item of order.order_items ?? []) {
      const key = item.product_id ?? item.product_name;
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          name: item.product_name,
          image: null,
          quantity: 0,
          orderCount: 0,
          revenue: 0,
          variants: [],
          lines: [],
          orderIds: new Set<string>(),
          variantMap: new Map<string, number>(),
        };
        map.set(key, group);
      }

      if (!group.image && item.image_url) group.image = item.image_url;

      const label = itemLabel(item);
      const amount = Number(item.line_total);

      group.lines.push({
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: customer?.full_name ?? "Unknown customer",
        customerPhone: customer?.phone ?? "",
        label,
        quantity: item.quantity,
        amount,
        status: order.status,
        paymentStatus: order.payment_status,
        counted,
      });

      if (counted) {
        group.quantity += item.quantity;
        group.revenue += amount;
        group.orderIds.add(order.id);
        group.variantMap.set(label, (group.variantMap.get(label) ?? 0) + item.quantity);
        totalQuantity += item.quantity;
        totalRevenue += amount;
      }
    }
  }

  const groups: ProductGroup[] = Array.from(map.values()).map(({ orderIds, variantMap, ...group }) => ({
    ...group,
    orderCount: orderIds.size,
    variants: Array.from(variantMap.entries())
      .map(([label, quantity]) => ({ label, quantity }))
      .sort((a, b) => b.quantity - a.quantity || a.label.localeCompare(b.label)),
  }));

  groups.sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));

  return {
    groups,
    orderCount: countedOrderIds.size,
    totalQuantity,
    totalRevenue,
    hiddenOrders,
  };
}

export { NO_OPTIONS };
