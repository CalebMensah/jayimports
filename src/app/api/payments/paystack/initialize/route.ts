import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializePaystackTransaction } from "@/lib/paystack";
import { z } from "zod";

const schema = z.object({
  orderNumber: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_status, payment_method, customer:customers(email, phone)")
    .eq("order_number", parsed.data.orderNumber)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_method !== "momo_auto") {
    return NextResponse.json({ error: "This order isn't set up for instant payment" }, { status: 400 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "This order is already paid" }, { status: 400 });
  }

  // Fallback email — Paystack requires one, but customer may not have provided it
  const customerEmail = (order.customer as any)?.email || `${(order.customer as any)?.phone}@jayimports-guest.com`;

  const reference = `JAY-${order.order_number}-${Date.now().toString(36)}`;

  try {
    const transaction = await initializePaystackTransaction({
      email: customerEmail,
      amountKobo: Math.round(Number(order.total) * 100),
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/order-confirmation/${order.order_number}`,
      metadata: { order_id: order.id, order_number: order.order_number },
    });

    // Log the attempt immediately so we have a record even if the customer abandons payment
    await supabase.from("payment_transactions").insert({
      order_id: order.id,
      provider: "paystack",
      provider_reference: reference,
      amount: order.total,
      status: "initiated",
    });

    return NextResponse.json({ authorizationUrl: transaction.authorization_url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment initialization failed" },
      { status: 500 }
    );
  }
}