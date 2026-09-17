import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { AnalyticsStatCard } from "@/components/admin/AnalyticsStatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { createClient } from "@/lib/supabase/server";
import { getAnalytics } from "@/lib/analytics";
import {
  HiOutlineClipboardList,
  HiOutlineCreditCard,
  HiOutlineShoppingBag,
  HiOutlineCash,
  HiOutlineTrendingUp,
  HiOutlineUsers,
  HiOutlineArrowRight,
} from "react-icons/hi";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: pendingOrders }, { count: unpaidCount }, { count: productCount }, analytics] =
    await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("payment_status", "pending_confirmation"),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
      getAnalytics(supabase),
    ]);

  const attentionStats = [
    { label: "Orders awaiting action", value: pendingOrders ?? 0, icon: HiOutlineClipboardList },
    { label: "Payments to confirm", value: unpaidCount ?? 0, icon: HiOutlineCreditCard },
    { label: "Active products", value: productCount ?? 0, icon: HiOutlineShoppingBag },
  ];

  return (
    <div>
      <PageHeader title="Overview" description="What needs your attention right now" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-navy-900">Business snapshot</h2>
        <Link
          href="/admin/analytics"
          className="text-sm text-ocean hover:underline flex items-center gap-1"
        >
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
