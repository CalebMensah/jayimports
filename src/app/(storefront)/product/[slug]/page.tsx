import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetail } from "@/components/storefront/ProductDetail";
import { getCurrentBatch } from "@/lib/batches";
import { BatchBanner } from "@/components/storefront/BatchBanner";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const batch = await getCurrentBatch(supabase);

  const { data: product, error } = await supabase
    .from("products")
    .select(`*,
      product_images(image_url, sort_order),
      product_colors(id, color_name, image_url, sort_order),
      product_sizes(id, size_value, price_adjustment, sort_order)`)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !product) notFound();

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6">
        <BatchBanner batch={batch} />
      </div>
      <ProductDetail product={product} />
    </div>
  );
}
