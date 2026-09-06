import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatus, type PaymentStatus } from "@/lib/orders";

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment_status?: string }>;
}) {
  const { status, payment_status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, status, payment_status, payment_method, total, created_at, customer:customers(full_name, phone)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (payment_status) query = query.eq("payment_status", payment_status);

  const { data: orders } = await query;

  return (
    <div>
      <PageHeader title="Orders" description="Track and manage incoming orders" />

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <FilterLink label="All" href="/admin/orders" active={!status && !payment_status} />
        <FilterLink label="Pending" href="/admin/orders?status=pending" active={status === "pending"} />
        <FilterLink label="Awaiting payment" href="/admin/orders?payment_status=pending_confirmation" active={payment_status === "pending_confirmation"} />
        <FilterLink label="Confirmed" href="/admin/orders?status=confirmed" active={status === "confirmed"} />
        <FilterLink label="Ready" href="/admin/orders?status=ready" active={status === "ready"} />
      </div>

<div className="bg-white border border-navy-100 rounded overflow-x-auto">
  <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-navy-50 text-navy-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => (
              <tr key={order.id} className="border-t border-navy-50 hover:bg-navy-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="text-ocean hover:underline font-medium">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-navy-700">
                  {order.customer?.[0]?.full_name}
                  <span className="text-navy-400 block text-xs">{order.customer?.[0]?.phone}</span>
                </td>
                <td className="px-4 py-3 text-navy-700">GH₵{order.total}</td>
                <td className="px-4 py-3">
                  <PaymentBadge status={order.payment_status as PaymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status as OrderStatus} />
                </td>
                <td className="px-4 py-3 text-navy-400 text-xs">
                  {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders?.length === 0 && (
          <p className="text-center text-navy-400 text-sm py-12">No orders match this filter.</p>
        )}
      </div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-full border ${
        active
          ? "bg-navy-800 text-white border-navy-800"
          : "border-navy-100 text-navy-500 hover:bg-navy-50"
      }`}
    >
      {label}
    </Link>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-ocean/10 text-ocean",
    preparing: "bg-ocean/10 text-ocean",
    ready: "bg-turquoise/10 text-turquoise-dark",
    completed: "bg-navy-50 text-navy-500",
    cancelled: "bg-red-50 text-red-600",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded ${colors[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const colors: Record<PaymentStatus, string> = {
    unpaid: "bg-navy-50 text-navy-500",
    pending_confirmation: "bg-amber-50 text-amber-700",
    paid: "bg-turquoise/10 text-turquoise-dark",
    failed: "bg-red-50 text-red-600",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded ${colors[status]}`}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}