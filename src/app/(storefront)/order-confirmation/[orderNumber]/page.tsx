import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmPayment } from "@/lib/payments";
import { SHIPPING_INFO } from "@/lib/constants";
import { OrderNumberSaveNotice } from "@/components/storefront/OrderNumberSaveNotice";
import { PaymentStatusWatcher } from "@/components/storefront/PaymentStatusWatcher";

const ORDER_FIELDS = "id, order_number, total, payment_method, payment_status, fulfillment_type";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { orderNumber } = await params;
  const { reference: rawReference } = await searchParams;
  const reference = typeof rawReference === "string" ? rawReference : undefined;
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(ORDER_FIELDS)
    .eq("order_number", orderNumber)
    .single();

  if (error || !order) {
    notFound();
  }

  // Back from Paystack: check the payment now, so a paid order is already paid on the first load
  let paid = order.payment_status === "paid";
  if (!paid) paid = (await confirmPayment(supabase, order, reference)) === "paid";

  // Private setting: read on the server only, and only for paid orders
  const groupUrl = paid ? process.env.SHIPPING_GROUP_URL : undefined;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 md:py-20 text-center">
      <h1 className="font-display text-2xl text-navy-900 mb-2">
        {paid ? "Payment confirmed" : "Order placed"}
      </h1>
      <p className="text-navy-500 mb-6">
        Order number <span className="text-navy-900 font-medium">{order.order_number}</span>
      </p>

      <OrderNumberSaveNotice orderNumber={order.order_number} />

      {paid ? (
        <>
          <p className="text-sm text-navy-600 bg-turquoise/10 rounded p-4 mb-4">
            We&apos;ve received your payment of GH₵{order.total}. We&apos;ll start preparing your order.
          </p>
          {groupUrl && (
            <div className="border border-navy-100 rounded p-4 mb-6 text-left">
              <p className="text-sm text-navy-700 font-medium mb-1">Shipping updates</p>
              <p className="text-xs text-navy-500 mb-3 leading-relaxed">{SHIPPING_INFO.disclaimer}</p>
              <a
                href={groupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-navy-800 text-white text-sm px-4 py-2 rounded hover:bg-navy-700 transition"
              >
                Join shipping updates group
              </a>
            </div>
          )}
        </>
      ) : (
        <PaymentStatusWatcher orderNumber={order.order_number} reference={reference} />
      )}

      <Link href="/shop" className="text-ocean hover:underline text-sm">Continue shopping</Link>
    </div>
  );
}
