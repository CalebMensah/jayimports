import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = (searchParams.get("orderNumber") ?? "").trim();
  const reference = searchParams.get("reference") ?? undefined;

  if (!/^[A-Za-z0-9-]{6,40}$/.test(orderNumber)) {
    return NextResponse.json({ state: "unknown" }, { status: 400, headers: NO_STORE });
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ state: "unknown" }, { status: 404, headers: NO_STORE });
  }

  // Only the payment state is returned. The group link itself is only ever put on the page by the server.
  const state = await confirmPayment(supabase, order, reference);
  return NextResponse.json({ state }, { headers: NO_STORE });
}
