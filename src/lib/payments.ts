import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyPaystackTransaction } from "@/lib/paystack";

export type PaymentState = "paid" | "pending";

type OrderForPayment = {
  id: string;
  order_number: string;
  total: number | string;
  payment_status: string;
};

const REFERENCE_FORMAT = /^[A-Za-z0-9._=-]{6,100}$/;

/**
 * Asks Paystack whether this order has been paid, and marks it paid only for a real payment:
 * the reference has to be one we issued for THIS order, and the amount has to cover the order total.
 */
export async function confirmPayment(
  supabase: SupabaseClient,
  order: OrderForPayment,
  reference: string | undefined
): Promise<PaymentState> {
  if (order.payment_status === "paid") return "paid";
  if (!reference || !REFERENCE_FORMAT.test(reference)) return "pending";

  const { data: issued } = await supabase
    .from("payment_transactions")
    .select("id")
    .eq("order_id", order.id)
    .eq("provider", "paystack")
    .eq("provider_reference", reference)
    .limit(1)
    .maybeSingle();

  if (!issued) {
    console.error("PAYMENT CHECK: reference was not issued for this order:", order.order_number);
    return "pending";
  }

  const verified = await verifyPaystackTransaction(reference).catch((err) => {
    console.error("PAYMENT CHECK: Paystack verify failed:", err instanceof Error ? err.message : err);
    return null;
  });

  if (!verified || verified.status !== "success") return "pending";

  const expected = Math.round(Number(order.total) * 100);
  if (verified.amount < expected) {
    console.error("PAYMENT CHECK: amount too low for", order.order_number, verified.amount, "<", expected);
    return "pending";
  }

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "paid", status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .in("payment_status", ["unpaid", "pending_confirmation", "failed"]);

  if (error) {
    console.error("PAYMENT CHECK: could not mark order paid:", error.message);
    return "pending";
  }

  // Keep the audit trail honest: the payment we issued is now a successful one
  await supabase.from("payment_transactions").update({ status: "success" }).eq("id", issued.id);

  return "paid";
            }
