import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { AnalyticsStatCard } from "@/components/admin/AnalyticsStatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { createClient } from "@/lib/supabase/server";
import { getAnalytics } from "@/lib/analytics";
import { daysUntil } from "@/lib/batches";
import {
  HiOutlineClock,
  HiOutlineShoppingBag,
  HiOutlineCash,
  HiOutlineTrendingUp,
  HiOutlineUsers,
  HiOutlineArrowRight,
  HiOutlineCollection,
} from "react-icons/hi";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: productCount }, analytics] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
    getAnalytics(supabase),
  ]);

  const attentionStats = [
    { label: "Waiting for next batch", value: analytics.waitingForBatchCount, icon: HiOutlineClock },
    { label: "Active products", value: productCount ?? 0, icon: HiOutlineShoppingBag },
  ];

  const daysLeft = analytics.currentBatch ? daysUntil(analytics.currentBatch.target_closes_at) : null;

  return (
    <div>
      <PageHeader title="Overview" description="What needs your attention right now" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {attentionStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-navy-100 rounded p-5 flex items-start justify-between">
              <div>
                <p className="text-3xl font-display text-navy-900">{stat.value}</p>
                <p className="text-sm text-navy-400 mt-1">{stat.label}</p>
              </div>
              <Icon className="w-6 h-6 text-turquoise-dark shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Current batch snapshot */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-navy-900">Current batch</h2>
        <Link href="/admin/batches" className="text-sm text-ocean hover:underline flex items-center gap-1">
          Manage batches <HiOutlineArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {analytics.currentBatch ? (
        <div className="bg-white border border-turquoise/30 rounded p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <HiOutlineCollection className="w-6 h-6 text-turquoise-dark shrink-0 mt-0.5" />
            <div>
              <p className="text-navy-900 font-medium">{analytics.currentBatch.name}</p>
              <p className="text-sm text-navy-400 mt-0.5">
                {analytics.currentBatch.orderCount} order{analytics.currentBatch.orderCount === 1 ? "" : "s"} · GH₵{analytics.currentBatch.revenue.toFixed(0)} revenue so far
              </p>
            </div>
          </div>
          {daysLeft !== null && (
            <span className={`text-sm font-medium px-3 py-1.5 rounded ${daysLeft <= 10 ? "bg-amber-50 text-amber-700" : "bg-navy-50 text-navy-600"}`}>
              {daysLeft < 0 ? "Target date passed" : daysLeft === 0 ? "Closes today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
            </span>
          )}
        </div>
      ) : (
        <div className="bg-white border border-navy-100 rounded p-5 mb-8">
          <p className="text-sm text-navy-500">
            No batch is currently open. {analytics.waitingForBatchCount > 0 && `${analytics.waitingForBatchCount} order(s) are waiting for the next one.`}
          </p>
          <Link href="/admin/batches" className="text-sm text-ocean hover:underline mt-2 inline-block">
            Open a new batch →
          </Link>
        </div>
      )}

      {/* Business snapshot */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-navy-900">Business snapshot</h2>
        <Link href="/admin/analytics" className="text-sm text-ocean hover:underline flex items-center gap-1">
          Full analytics <HiOutlineArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AnalyticsStatCard
          label="Total revenue (paid)"
          value={`GH₵${analytics.totalRevenue.toFixed(0)}`}
          icon={HiOutlineCash}
          changePercent={analytics.revenueChangePercent}
        />
        <AnalyticsStatCard
          label="Orders this month"
          value={analytics.thisMonthOrders.toString()}
          icon={HiOutlineTrendingUp}
        />
        <AnalyticsStatCard
          label="Total customers"
          value={analytics.totalCustomers.toString()}
          icon={HiOutlineUsers}
        />
      </div>

      <RevenueChart data={analytics.revenueTrend} />
    </div>
  );
}
