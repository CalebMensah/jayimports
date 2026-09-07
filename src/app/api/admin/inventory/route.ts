import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lowStockOnly = searchParams.get("low_stock") === "true";

  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, stock_quantity, is_preorder, status,
      product_colors(id, color_name, image_url),
      product_sizes(id, size_value),
      product_color_size_stock(id, color_id, size_id, stock_quantity)
    `)
    .neq("status", "archived")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flag products that need attention: plain products with low stock,
  // or any color+size combo with low stock
  const filtered = lowStockOnly
    ? data?.filter((p) => {
        if (p.is_preorder) return false;
        if (p.product_colors.length === 0) return p.stock_quantity <= 3;
        return p.product_color_size_stock.some((s) => s.stock_quantity <= 3);
      })
    : data;

  return NextResponse.json({ products: filtered });
}

const adjustSchema = z.union([
  // Plain product (no colors) — updates products.stock_quantity
  z.object({
    type: z.literal("product"),
    productId: z.string().uuid(),
    newQuantity: z.coerce.number().int().min(0),
  }),
  // Color+size combination — updates product_color_size_stock row
  z.object({
    type: z.literal("color_size"),
    stockId: z.string().uuid(),
    newQuantity: z.coerce.number().int().min(0),
  }),
]);

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.type === "product") {
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: parsed.data.newQuantity })
      .eq("id", parsed.data.productId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("product_color_size_stock")
      .update({ stock_quantity: parsed.data.newQuantity })
      .eq("id", parsed.data.stockId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}