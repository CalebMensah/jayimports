import { PageHeader } from "@/components/admin/PageHeader";
import { AnalyticsStatCard } from "@/components/admin/AnalyticsStatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { createClient } from "@/lib/supabase/server";
import { getAnalytics } from "@/lib/analytics";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";
import {
  HiOutlineCash,
  HiOutlineClipboardList,
  HiOutlineTrendingUp,
  HiOutlineUsers,
  HiOutlineExclamation,
} from "react-icons/hi";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const data = await getAnalytics(supabase);

  return (
    <div>
      <PageHeader title="Analytics" description="How the business is doing" />

      {/* Top-line stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnalyticsStatCard
          label="Total revenue (paid)"
          value={`GH₵${data.totalRevenue.toFixed(0)}`}
          icon={HiOutlineCash}
          changePercent={data.revenueChangePercent}
        />
        <AnalyticsStatCard
          label="Orders this month"
          value={data.thisMonthOrders.toString()}
          icon={HiOutlineClipboardList}
        />
        <AnalyticsStatCard
          label="Average order value"
          value={`GH₵${data.averageOrderValue.toFixed(0)}`}
          icon={HiOutlineTrendingUp}
        />
        <AnalyticsStatCard
          label="Total customers"
          value={data.totalCustomers.toString()}
          icon={HiOutlineUsers}
        />
      </div>

      {/* Revenue chart */}
      <div className="mb-6">
        <RevenueChart data={data.revenueTrend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order funnel */}
        <div className="bg-white border border-navy-100 rounded p-4 md:p-5">
          <h3 className="text-sm font-medium text-navy-900 mb-4">Orders by status</h3>
          <div className="space-y-2">
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => {
              const count = data.statusCounts[status] ?? 0;
              const percent = data.totalOrders > 0 ? (count / data.totalOrders) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs text-navy-500 mb-1">
                    <span>{ORDER_STATUS_LABELS[status]}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-turquoise-dark rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {data.cancellationRate > 0 && (
            <p className="text-xs text-navy-400 mt-4">
              Cancellation rate: {data.cancellationRate.toFixed(1)}%
            </p>
          )}
        </div>

        {/* Product mix + customers */}
        <div className="bg-white border border-navy-100 rounded p-4 md:p-5">
          <h3 className="text-sm font-medium text-navy-900 mb-4">Product & customer mix</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-navy-500">In-stock products</span>
              <span className="text-navy-900">{data.inStockCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500">Preorder products</span>
              <span className="text-navy-900">{data.preorderCount}</span>
            </div>
            <div className="border-t border-navy-50 pt-3 flex justify-between">
              <span className="text-navy-500">New customers</span>
              <span className="text-navy-900">{data.newCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500">Returning customers</span>
              <span className="text-navy-900">{data.returningCustomers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Best sellers */}
        <div className="bg-white border border-navy-100 rounded p-4 md:p-5">
          <h3 className="text-sm font-medium text-navy-900 mb-4">Best sellers (by quantity)</h3>
          {data.bestSellersByQuantity.length === 0 ? (
            <p className="text-sm text-navy-400">No paid sales yet.</p>
          ) : (
            <div className="space-y-2">
              {data.bestSellersByQuantity.map((p, i) => (
                <div key={p.name + i} className="flex justify-between text-sm">
                  <span className="text-navy-700 truncate pr-2">{i + 1}. {p.name}</span>
                  <span className="text-navy-400 shrink-0">{p.quantity} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top revenue products */}
        <div className="bg-white border border-navy-100 rounded p-4 md:p-5">
          <h3 className="text-sm font-medium text-navy-900 mb-4">Top products (by revenue)</h3>
          {data.bestSellersByRevenue.length === 0 ? (
            <p className="text-sm text-navy-400">No paid sales yet.</p>
          ) : (
            <div className="space-y-2">
              {data.bestSellersByRevenue.map((p, i) => (
                <div key={p.name + i} className="flex justify-between text-sm">
                  <span className="text-navy-700 truncate pr-2">{i + 1}. {p.name}</span>
                  <span className="text-navy-400 shrink-0">GH₵{p.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {data.lowStockProducts.length > 0 && (
        <div className="bg-white border border-navy-100 rounded p-4 md:p-5">
          <h3 className="text-sm font-medium text-navy-900 mb-3 flex items-center gap-2">
            <HiOutlineExclamation className="w-4 h-4 text-amber-500" />
            Low stock ({data.lowStockProducts.length})
          </h3>
          <div className="space-y-1">
            {data.lowStockProducts.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-navy-700">{p.name}</span>
                <span className="text-red-600">{p.stock_quantity} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}