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

  const [{ data: categories }, { data: product }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("products")
      .select("*, product_images(image_url), product_variants(*)")
      .eq("id", id)
      .single(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <PageHeader title="Edit product" description={product.name} />
      <ProductForm categories={categories ?? []} existingProduct={product} />
    </div>
  );
}