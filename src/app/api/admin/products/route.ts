import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation/product";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
    .select("*, category:categories(name), product_images(image_url, sort_order)", { count: "exact" })
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

  const { variants, ...productData } = parsed.data;
  const images: string[] = body.images ?? []; // array of Cloudinary URLs from prior upload step

  if (images.length === 0) {
    return NextResponse.json({ error: "At least one product image is required" }, { status: 400 });
  }

  let slug = slugify(productData.name);

  // Ensure slug uniqueness
  const { data: existing } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ ...productData, slug })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Insert images
  const imageRows = images.map((url, i) => ({
    product_id: product.id,
    image_url: url,
    sort_order: i,
  }));
  await supabase.from("product_images").insert(imageRows);

  // Insert variants, if any
  if (variants.length > 0) {
    const variantRows = variants.map((v) => ({
      product_id: product.id,
      name: v.name,
      value: v.value,
      stock_quantity: v.stock_quantity,
      price_adjustment: v.price_adjustment,
    }));
    await supabase.from("product_variants").insert(variantRows);
  }

  return NextResponse.json({ product }, { status: 201 });
}