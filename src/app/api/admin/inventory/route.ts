import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lowStockOnly = searchParams.get("low_stock") === "true";

  let query = supabase
    .from("products")
    .select("id, name, stock_quantity, is_preorder, status, product_variants(id, name, value, stock_quantity)")
    .neq("status", "archived")
    .order("stock_quantity", { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = lowStockOnly ? data?.filter((p) => p.stock_quantity <= 3) : data;

  return NextResponse.json({ products: filtered });
}

const adjustSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  newQuantity: z.coerce.number().int().min(0),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { productId, variantId, newQuantity } = parsed.data;

  const table = variantId ? "product_variants" : "products";
  const id = variantId ?? productId;

  const { error } = await supabase
    .from(table)
    .update({ stock_quantity: newQuantity })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}