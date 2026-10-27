import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { PageHeader } from "@/components/admin/PageHeader";
import { BatchProducts } from "@/components/admin/BatchProducts";
import { createClient } from "@/lib/supabase/server";
import { getBatchOrders, groupByProduct } from "@/lib/batch-orders";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BatchOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const { id } = await params;
  const { show } = await searchParams;

  const isWaiting = id === "waiting";
  if (!isWaiting && !UUID.test(id)) notFound();

  const supabase = await createClient();

  let batch: {
    id: string;
    name: string;
    status: string;
    opened_at: string;
    closed_at: string | null;
  } | null = null;

  if (!isWaiting) {
    const { data } = await supabase
      .from("preorder_batches")
      .select("id, name, status, opened_at, closed_at")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    batch = data;
  }

  const includeAll = show === "all";
  const { orders, failed } = await getBatchOrders(supabase, isWaiting ? null : id);
  const summary = groupByProduct(orders, includeAll);

  const title = batch ? batch.name : "Waiting for next batch";
  const description = !batch
    ? "Orders placed while no batch was open. They join the next batch you open."
    : batch.status === "open"
      ? `Open since ${formatDate(batch.opened_at)}`
      : `Closed${batch.closed_at ? ` ${formatDate(batch.closed_at)}` : ""}`;

  const basePath = `/admin/batches/${id}`;

  const stats = [
    { label: "Products", value: summary.groups.length.toString() },
    { label: "Units to source", value: summary.totalQuantity.toString() },
    { label: "Orders", value: summary.orderCount.toString() },
    { label: "Revenue", value: `GH₵${summary.totalRevenue.toFixed(2)}` },
  ];

  return (
    <div>
      <Link
        href="/admin/batches"
        className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-900 mb-4"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> All batches
      </Link>

      <PageHeader title={title} description={description} />

      {failed && (
        <p className="text-sm text-red-600 bg-red-50 rounded p-3 mb-4">
          Couldn&apos;t load every order. Refresh the page, and if this keeps happening check the server logs.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-navy-100 rounded p-4">
            <p className="text-2xl font-display text-navy-900">{stat.value}</p>
            <p className="text-xs text-navy-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Link
          href={basePath}
          className={`text-sm px-3 py-1.5 rounded-full border ${
            !includeAll ? "bg-navy-800 text-white border-navy-800" : "border-navy-100 text-navy-500 hover:bg-navy-50"
          }`}
        >
          Paid orders
        </Link>
        <Link
          href={`${basePath}?show=all`}
          className={`text-sm px-3 py-1.5 rounded-full border ${
            includeAll ? "bg-navy-800 text-white border-navy-800" : "border-navy-100 text-navy-500 hover:bg-navy-50"
          }`}
        >
          All orders
        </Link>
      </div>

      {!includeAll && summary.hiddenOrders > 0 && (
        <p className="text-xs text-navy-400 mb-4">
          {summary.hiddenOrders} unpaid or cancelled order{summary.hiddenOrders === 1 ? " isn't" : "s aren't"} counted.{" "}
          <Link href={`${basePath}?show=all`} className="text-ocean hover:underline">
            Show {summary.hiddenOrders === 1 ? "it" : "them"}
          </Link>
        </p>
      )}
      {includeAll && (
        <p className="text-xs text-navy-400 mb-4">
          Unpaid and cancelled orders are shown dimmed and aren&apos;t counted in the totals.
        </p>
      )}

      <BatchProducts groups={summary.groups} />
    </div>
  );
}
