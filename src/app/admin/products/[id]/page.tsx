import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: categories }, { data: raw }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("products")
      .select(`*,
        product_images(image_url),
        product_colors(id, color_name, image_url, sort_order, product_color_size_stock(id, size_id, stock_quantity)),
        product_sizes(id, size_value, price_adjustment, sort_order)`)
      .eq("id", id)
      .single(),
  ]);

  if (!raw) notFound();

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

  return (
    <div>
      <PageHeader title="Edit product" description={product.name} />
      <ProductForm categories={categories ?? []} existingProduct={product} />
    </div>
  );
}