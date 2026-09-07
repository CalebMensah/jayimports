// src/app/(storefront)/product/[slug]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetail } from "@/components/storefront/ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`*,
      product_images(image_url, sort_order),
      product_colors(id, color_name, image_url, sort_order),
      product_sizes(id, size_value, price_adjustment, sort_order),
      product_color_size_stock(color_id, size_id, stock_quantity)`)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

    if (error || !product) {
    console.error("PRODUCT DETAIL ERROR:", slug, error); // TEMP
    notFound();
  }

  return <ProductDetail product={product} />;
}