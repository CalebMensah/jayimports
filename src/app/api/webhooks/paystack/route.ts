import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Verify the webhook actually came from Paystack — critical, skip this and anyone can fake a "payment successful" event
  const expectedSignature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  if (!signature || signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createAdminClient();

  if (event.event === "charge.success") {
    const { reference, metadata, amount, status } = event.data;
    const orderId = metadata?.order_id;

    if (!orderId) {
      return NextResponse.json({ received: true }); // nothing to reconcile, ack anyway
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_status, total")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ received: true });
    }

    // Amount sanity check — protects against a tampered/mismatched webhook payload
    const expectedKobo = Math.round(Number(order.total) * 100);
    if (amount !== expectedKobo) {
      await supabase.from("payment_transactions").insert({
        order_id: order.id,
        provider: "paystack",
        provider_reference: reference,
        amount: amount / 100,
        status: "failed",
        raw_payload: event,
      });
      return NextResponse.json({ received: true });
    }

    if (order.payment_status !== "paid") {
      await supabase
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", order.id);

      await supabase.from("payment_transactions").insert({
        order_id: order.id,
        provider: "paystack",
        provider_reference: reference,
        amount: amount / 100,
        status: "success",
        raw_payload: event,
      });

      // TODO: trigger payment-confirmed email/SMS once notifications service is built
    }
  }

  if (event.event === "charge.failed") {
    const { reference, metadata, amount } = event.data;
    if (metadata?.order_id) {
      await supabase.from("payment_transactions").insert({
        order_id: metadata.order_id,
        provider: "paystack",
        provider_reference: reference,
        amount: amount / 100,
        status: "failed",
        raw_payload: event,
      });
    }
  }

  return NextResponse.json({ received: true });
}