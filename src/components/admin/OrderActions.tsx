"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_TRANSITIONS, ORDER_STATUS_LABELS, type OrderStatus, type PaymentStatus } from "@/lib/orders";
import { HiOutlineCheck, HiOutlineX as HiCancel } from "react-icons/hi";

export function OrderActions({
  orderId,
  currentStatus,
  currentPaymentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState("");

  async function updateOrder(payload: Record<string, string>) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Update failed");
      return;
    }

    router.refresh();
  }

  const nextStatuses = ALLOWED_TRANSITIONS[currentStatus];

  return (
    <div className="bg-white border border-navy-100 rounded p-5 space-y-4">
      <h3 className="font-medium text-navy-900 text-sm">Actions</h3>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

      {/* Manual payment confirmation */}
      {currentPaymentStatus !== "paid" && (
        <div className="border border-navy-100 rounded p-3">
          <p className="text-xs text-navy-500 mb-2">Confirm payment received via MoMo</p>
          <input
            placeholder="MoMo transaction ref (optional)"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            className="w-full border border-navy-100 rounded px-2 py-1.5 text-sm mb-2"
          />
          <button
            disabled={loading}
            onClick={() => updateOrder({ payment_status: "paid", payment_reference: paymentRef })}
            className="w-full flex items-center justify-center gap-2 bg-turquoise-dark text-white text-sm py-2 rounded hover:bg-turquoise transition disabled:opacity-50"
          >
            <HiOutlineCheck className="w-4 h-4" /> Mark as paid
          </button>
        </div>
      )}

      {/* Status progression */}
 {nextStatuses.map((status) => (
              <button
                key={status}
                disabled={loading}
                onClick={() => updateOrder({ status })}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border transition disabled:opacity-50 ${
                  status === "cancelled"
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-white"
                }`}
              >
                {status === "cancelled" && <HiCancel className="w-3.5 h-3.5" />}
                {ORDER_STATUS_LABELS[status]}
              </button>
            ))}

      {nextStatuses.length === 0 && (
        <p className="text-xs text-navy-400">This order is in a final state.</p>
      )}
    </div>
  );
}