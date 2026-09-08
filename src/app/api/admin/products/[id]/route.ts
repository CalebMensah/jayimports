import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation/product";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: raw, error } = await supabase
    .from("products")
    .select(`*,
      product_images(id, image_url, sort_order),
      product_colors(id, color_name, image_url, sort_order, product_color_size_stock(id, size_id, stock_quantity)),
      product_sizes(id, size_value, price_adjustment, sort_order)`)
    .eq("id", id)
    .single();

  if (error || !raw) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  // Flatten color -> stock nesting into a simple color_id/size_id/stock_quantity array,
  // since product_color_size_stock has no direct FK to products, only to product_colors.
  const product = {
    ...raw,
    product_color_size_stock: raw.product_colors.flatMap((c: any) =>
      (c.product_color_size_stock ?? []).map((s: any) => ({
        color_id: c.id,
        size_id: s.size_id,
        stock_quantity: s.stock_quantity,
      }))
    ),
  };

  return NextResponse.json({ product });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { colors, sizes, stock, ...productData } = parsed.data;

  const { data: product, error } = await supabase
    .from("products")
    .update({ ...productData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.images) {
    await supabase.from("product_images").delete().eq("product_id", id);
    const imageRows = (body.images as string[]).map((url: string, i: number) => ({
      product_id: id,
      image_url: url,
      sort_order: i,
    }));
    if (imageRows.length > 0) await supabase.from("product_images").insert(imageRows);
  }

  // Colors/sizes/stock: replace wholesale on edit (cascade delete handles cleanup)
  if (colors !== undefined) {
    await supabase.from("product_colors").delete().eq("product_id", id); // cascades to stock rows referencing these colors
    await supabase.from("product_sizes").delete().eq("product_id", id); // cascades to remaining stock rows

    const colorIdMap = new Map<string, string>();
    if (colors.length > 0) {
      const { data: insertedColors, error: colorError } = await supabase
        .from("product_colors")
        .insert(colors.map((c, i) => ({ product_id: id, color_name: c.color_name, image_url: c.image_url, sort_order: i })))
        .select();
      if (colorError) return NextResponse.json({ error: colorError.message }, { status: 500 });
      insertedColors.forEach((row, i) => colorIdMap.set(colors[i].client_id, row.id));
    }

    const sizeIdMap = new Map<string, string>();
    if (sizes && sizes.length > 0) {
      const { data: insertedSizes, error: sizeError } = await supabase
        .from("product_sizes")
        .insert(sizes.map((s, i) => ({ product_id: id, size_value: s.size_value, price_adjustment: s.price_adjustment, sort_order: i })))
        .select();
      if (sizeError) return NextResponse.json({ error: sizeError.message }, { status: 500 });
      insertedSizes.forEach((row, i) => sizeIdMap.set(sizes[i].client_id, row.id));
    }

    if (stock && stock.length > 0) {
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
  }

  return NextResponse.json({ product });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}