import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  let query = supabase
    .from("products")
    .select("id, name, slug, price, stock_quantity, is_preorder, category:categories(slug, name), product_images(image_url, sort_order)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("categories.slug", category);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data });
}