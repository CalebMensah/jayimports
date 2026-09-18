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
} from "react-icons/hi";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const data = await getAnalytics(supabase);

  return (
    <div>
      <PageHeader title="Analytics" description="How the business is doing" />

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

      <div className="mb-6">
        <RevenueChart data={data.revenueTrend} />
      </div>

      {/* Batch performance */}
      <div className="bg-white border border-navy-100 rounded p-4 md:p-5 mb-6">
        <h3 className="text-sm font-medium text-navy-900 mb-4">Batch performance</h3>
        {data.batches.length === 0 ? (
          <p className="text-sm text-navy-400">No batches created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-navy-500 text-xs">
                  <th className="pb-2 font-normal">Batch</th>
                  <th className="pb-2 font-normal text-center">Orders</th>
                  <th className="pb-2 font-normal text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.batches.map((batch) => (
                  <tr key={batch.id} className="border-t border-navy-50">
                    <td className="py-2.5">
                      <span className="text-navy-900">{batch.name}</span>
                      {batch.status === "open" && (
                        <span className="ml-2 text-[10px] bg-turquoise/10 text-turquoise-dark px-1.5 py-0.5 rounded">OPEN</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-navy-600">{batch.orderCount}</td>
                    <td className="py-2.5 text-right text-navy-900">GH₵{batch.revenue.toFixed(0)}</td>
                  </tr>
                ))}
                {data.waitingForBatchCount > 0 && (
                  <tr className="border-t border-navy-50">
                    <td className="py-2.5 text-navy-400 italic">Waiting for next batch</td>
                    <td className="py-2.5 text-center text-navy-400">{data.waitingForBatchCount}</td>
                    <td className="py-2.5 text-right text-navy-400">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                    <div className="h-full bg-turquoise-dark rounded-full" style={{ width: `${percent}%` }} />
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

        <div className="bg-white border border-navy-100 rounded p-4 md:p-5">
          <h3 className="text-sm font-medium text-navy-900 mb-4">Customers</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-navy-500">New customers</span>
              <span className="text-navy-900">{data.newCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-500">Returning customers</span>
              <span className="text-navy-900">{data.returningCustomers}</span>
            </div>
            <div className="border-t border-navy-50 pt-3 flex justify-between">
              <span className="text-navy-500">Total customers</span>
              <span className="text-navy-900">{data.totalCustomers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
}
