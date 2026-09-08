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

  const { data: raw, error } = await supabase
    .from("products")
    .select(`*,
      product_images(image_url, sort_order),
      product_colors(id, color_name, image_url, sort_order, product_color_size_stock(size_id, stock_quantity)),
      product_sizes(id, size_value, price_adjustment, sort_order)`)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !raw) {
    notFound();
  }

  // Flatten color→stock nesting into a simple color_id/size_id/stock_quantity array
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

  return <ProductDetail product={product} />;
}