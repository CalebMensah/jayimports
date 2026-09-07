import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation/product";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = 20;

  const { data, error, count } = await supabase
    .from("products")
    .select("*, category:categories(name), product_images(image_url, sort_order), product_colors(id, color_name, image_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data, total: count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { colors, sizes, stock, ...productData } = parsed.data;
  const images: string[] = body.images ?? [];

  if (images.length === 0 && colors.length === 0) {
    return NextResponse.json({ error: "Add at least one product image, or a color with a photo" }, { status: 400 });
  }

  let slug = slugify(productData.name);
  const { data: existing } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ ...productData, slug })
    .select()
    .single();

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });

  if (images.length > 0) {
    await supabase.from("product_images").insert(
      images.map((url, i) => ({ product_id: product.id, image_url: url, sort_order: i }))
    );
  }

  // Insert colors, tracking client_id -> real DB id
  const colorIdMap = new Map<string, string>();
  if (colors.length > 0) {
    const { data: insertedColors, error: colorError } = await supabase
      .from("product_colors")
      .insert(colors.map((c, i) => ({ product_id: product.id, color_name: c.color_name, image_url: c.image_url, sort_order: i })))
      .select();
    if (colorError) return NextResponse.json({ error: colorError.message }, { status: 500 });
    insertedColors.forEach((row, i) => colorIdMap.set(colors[i].client_id, row.id));
  }

  // Insert sizes, tracking client_id -> real DB id
  const sizeIdMap = new Map<string, string>();
  if (sizes.length > 0) {
    const { data: insertedSizes, error: sizeError } = await supabase
      .from("product_sizes")
      .insert(sizes.map((s, i) => ({ product_id: product.id, size_value: s.size_value, price_adjustment: s.price_adjustment, sort_order: i })))
      .select();
    if (sizeError) return NextResponse.json({ error: sizeError.message }, { status: 500 });
    insertedSizes.forEach((row, i) => sizeIdMap.set(sizes[i].client_id, row.id));
  }

  // Insert stock combinations using the resolved real ids
  if (stock.length > 0) {
    const stockRows = stock
      .map((s) => ({
        color_id: colorIdMap.get(s.color_client_id),
        size_id: sizeIdMap.get(s.size_client_id),
        stock_quantity: s.stock_quantity,
      }))
      .filter((s) => s.color_id && s.size_id);

    if (stockRows.length > 0) {
      const { error: stockError } = await supabase.from("product_color_size_stock").insert(stockRows);
      if (stockError) return NextResponse.json({ error: stockError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ product }, { status: 201 });
}