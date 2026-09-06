import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/storefront/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS } from "@/lib/constants";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("slug, name, price, stock_quantity, is_preorder, product_images(image_url, sort_order)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .order("name")
    .limit(4);

  return (
    <div>
      {/* Hero — grounded in the actual business (sourcing/import), not a generic gradient */}
      <section className="border-b border-navy-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-24 grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          <div>
            <p className="text-turquoise-dark text-sm font-medium mb-3">{BUSINESS.tagline}</p>
            <h1 className="font-display text-4xl md:text-5xl text-navy-900 leading-tight">
              Quality goods, sourced from China and beyond, delivered to Ghana.
            </h1>
            <p className="text-navy-500 mt-4 max-w-md">
              Fashion, electronics, home items, and more — order what you need and we handle the sourcing and importation.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-6 bg-navy-800 text-white px-6 py-3 rounded text-sm font-medium hover:bg-navy-700 transition"
            >
              Browse products
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories && categories.length > 0
              ? categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="relative h-24 md:h-28 rounded overflow-hidden border border-navy-100 bg-canvas group"
                  >
                    {cat.image_url ? (
                      <>
                        <Image
                          src={cat.image_url}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 200px"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-navy-900/30 group-hover:bg-navy-900/40 transition-colors" />
                        <p className="absolute bottom-2 left-3 text-sm font-medium text-white drop-shadow">
                          {cat.name}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full p-4">
                        <p className="text-sm text-navy-700">{cat.name}</p>
                      </div>
                    )}
                  </Link>
                ))
              : BUSINESS.categories.slice(0, 4).map((cat) => (
                  <div key={cat} className="bg-canvas border border-navy-100 rounded p-4">
                    <p className="text-sm text-navy-700">{cat}</p>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-navy-900">Latest arrivals</h2>
          <Link href="/shop" className="text-sm text-ocean hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts?.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}