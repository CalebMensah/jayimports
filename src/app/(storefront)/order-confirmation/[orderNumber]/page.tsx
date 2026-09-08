import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackTransaction } from "@/lib/paystack";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { orderNumber } = await params;
  const { reference } = await searchParams;
  const supabase = createAdminClient();

  let { data: order } = await supabase
    .from("orders")
    .select("order_number, total, payment_method, payment_status, fulfillment_type")
    .eq("order_number", orderNumber)
    .single();

  if (!order) notFound();

  // Fallback verification if the webhook hasn't landed yet
  if (reference && order.payment_status !== "paid") {
    try {
      const verified = await verifyPaystackTransaction(reference);
      if (verified.status === "success") {
        await supabase
          .from("orders")
          .update({ payment_status: "paid", status: "confirmed" })
          .eq("order_number", orderNumber)
          .eq("payment_status", "unpaid"); // avoid double-processing if webhook just landed

        const refreshed = await supabase
          .from("orders")
          .select("order_number, total, payment_method, payment_status, fulfillment_type")
          .eq("order_number", orderNumber)
          .single();
        order = refreshed.data ?? order;
      }
    } catch {
      // verification failed — leave status as-is, webhook may still resolve it
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-2xl text-navy-900 mb-2">
        {order.payment_status === "paid" ? "Payment confirmed" : "Order placed"}
      </h1>
      <p className="text-navy-500 mb-6">
        Order number <span className="text-navy-900 font-medium">{order.order_number}</span>
      </p>

      {order.payment_status === "paid" ? (
        <p className="text-sm text-navy-600 bg-turquoise/10 rounded p-4 mb-6">
          We've received your payment of GH₵{order.total}. We'll start preparing your order.
        </p>
      ) : order.payment_method === "momo_manual" ? (
        <p className="text-sm text-navy-600 bg-turquoise/10 rounded p-4 mb-6">
          Please send GH₵{order.total} via Mobile Money to <strong>0247288663</strong>, then we'll confirm your order shortly.
        </p>
      ) : (
        <p className="text-sm text-navy-600 bg-amber-50 rounded p-4 mb-6">
          We're still confirming your payment — this can take a minute. Refresh this page shortly, or contact us if it doesn't update.
        </p>
      )}

      <Link href="/shop" className="text-ocean hover:underline text-sm">Continue shopping</Link>
    </div>
  );
}