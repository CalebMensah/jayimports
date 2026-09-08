import { ProductCard } from "@/components/storefront/ProductCard";
import { SearchBar } from "@/components/storefront/SearchBar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const supabase = await createClient();

  const { data: allCategories } = await supabase
    .from("categories")
    .select("name, slug, image_url")
    .order("name");

  let query = supabase
    .from("products")
    .select("slug, name, price, stock_quantity, is_preorder, category:categories!inner(slug, name), product_images(image_url, sort_order), product_colors(image_url, sort_order)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category.slug", category);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: products } = await query;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display text-3xl text-navy-900 mb-6">Shop</h1>

      <div className="mb-6 max-w-sm">
        <SearchBar initialValue={search ?? ""} />
      </div>

      {/* Category image rail */}
      <div className="flex gap-4 overflow-x-auto pb-2 mb-8 -mx-4 px-4 md:mx-0 md:px-0">
        <Link
          href={search ? `/shop?search=${search}` : "/shop"}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 transition ${
              !category ? "border-turquoise-dark bg-turquoise/10" : "border-navy-100 bg-navy-50 group-hover:border-navy-300"
            }`}
          >
            <span className="text-xs text-navy-500 font-medium">All</span>
          </div>
          <span className={`text-xs ${!category ? "text-navy-900 font-medium" : "text-navy-500"}`}>All</span>
        </Link>

        {allCategories?.map((cat) => {
          const href = search ? `/shop?category=${cat.slug}&search=${search}` : `/shop?category=${cat.slug}`;
          const isActive = category === cat.slug;
          return (
            <Link key={cat.slug} href={href} className="flex flex-col items-center gap-2 shrink-0 group">
              <div
                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition ${
                  isActive ? "border-turquoise-dark" : "border-navy-100 group-hover:border-navy-300"
                }`}
              >
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full bg-navy-50 flex items-center justify-center">
                    <span className="text-[10px] text-navy-400 px-1 text-center leading-tight">{cat.name}</span>
                  </div>
                )}
              </div>
              <span
                className={`text-xs text-center max-w-[80px] leading-tight ${
                  isActive ? "text-navy-900 font-medium" : "text-navy-500"
                }`}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>

      {search && (
        <p className="text-sm text-navy-400 mb-4">
          {products?.length ?? 0} result{products?.length === 1 ? "" : "s"} for &ldquo;{search}&rdquo;
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products?.map((product) => (
          <ProductCard key={product.slug} product={product as any} />
        ))}
      </div>

      {products?.length === 0 && (
        <p className="text-navy-400 text-sm py-12 text-center">
          {search ? `No products match "${search}".` : "No products in this category yet."}
        </p>
      )}
    </div>
  );
}