"use client";

import { useState } from "react";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatus, type PaymentStatus } from "@/lib/orders";
import { HiOutlineSearch, HiOutlineClipboardCheck } from "react-icons/hi";

type OrderResult = {
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_type: string;
  total: number;
  created_at: string;
  order_items: { product_name: string; quantity: number; line_total: number }[];
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    const res = await fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, phone }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Order not found");
      return;
    }

    setOrder(data.order);
  }

  return (
    <div className="max-w-lg mx-auto px-4 md:px-6 py-14">
      <h1 className="font-display text-2xl text-navy-900 mb-2">Track your order</h1>
      <p className="text-sm text-navy-500 mb-6">
        Enter your order number and the phone number you used at checkout.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          placeholder="Order number (e.g. ORD-20260902-A1B2C3)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
        />
        <input
          required
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-navy-800 text-white py-2.5 rounded text-sm font-medium hover:bg-navy-700 transition disabled:opacity-50"
        >
          <HiOutlineSearch className="w-4 h-4" />
          {loading ? "Checking..." : "Track order"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3 mt-4">{error}</p>}

      {order && (
        <div className="mt-6 border border-navy-100 rounded p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-start gap-2">
              <HiOutlineClipboardCheck className="w-5 h-5 text-navy-400 mt-0.5" />
              <div>
                <p className="text-sm text-navy-900 font-medium">{order.order_number}</p>
                <p className="text-xs text-navy-400">
                  {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <span className="text-xs bg-turquoise/10 text-turquoise-dark px-2 py-1 rounded">
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <div className="space-y-1 mb-3">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-navy-600">
                <span>{item.product_name} × {item.quantity}</span>
                <span>GH₵{item.line_total}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-navy-100 pt-3 flex justify-between text-sm">
            <span className="text-navy-500">Payment</span>
            <span className="text-navy-900">{PAYMENT_STATUS_LABELS[order.payment_status]}</span>
          </div>
          <div className="flex justify-between text-sm mt-1 font-medium">
            <span className="text-navy-700">Total</span>
            <span className="text-navy-900">GH₵{order.total}</span>
          </div>
        </div>
      )}
    </div>
  );
}