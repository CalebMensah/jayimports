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

  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(image_url, sort_order), product_variants(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!product) notFound();

  return <ProductDetail product={product} />;
}