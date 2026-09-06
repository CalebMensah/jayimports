import { PageHeader } from "@/components/admin/PageHeader";
import { InventoryRow } from "@/components/admin/InventoryRow";
import { createClient } from "@/lib/supabase/server";
import { HiOutlineExclamation } from "react-icons/hi";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock_quantity, is_preorder, product_variants(id, name, value, stock_quantity)")
    .neq("status", "archived")
    .order("stock_quantity", { ascending: true });

  const lowStockCount = products?.filter((p) => !p.is_preorder && p.stock_quantity <= 3).length ?? 0;

  const displayProducts = filter === "low"
    ? products?.filter((p) => !p.is_preorder && p.stock_quantity <= 3)
    : products;

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock levels across all products"
      />

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded mb-4">
          <HiOutlineExclamation className="w-4 h-4 shrink-0" />
          {lowStockCount} product{lowStockCount === 1 ? "" : "s"} running low on stock
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <a
          href="/admin/inventory"
          className={`text-sm px-3 py-1.5 rounded-full border ${!filter ? "bg-navy-800 text-white border-navy-800" : "border-navy-100 text-navy-500"}`}
        >
          All
        </a>
        <a
          href="/admin/inventory?filter=low"
          className={`text-sm px-3 py-1.5 rounded-full border ${filter === "low" ? "bg-navy-800 text-white border-navy-800" : "border-navy-100 text-navy-500"}`}
        >
          Low stock
        </a>
      </div>

      <div className="bg-white border border-navy-100 rounded overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead className="bg-navy-50 text-navy-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Stock</th>
            </tr>
          </thead>
          <tbody>
            {displayProducts?.map((product) =>
              product.product_variants && product.product_variants.length > 0 ? (
                product.product_variants.map((v) => (
                  <InventoryRow
                    key={v.id}
                    id={product.id}
                    variantId={v.id}
                    label={product.name}
                    sublabel={`${v.name}: ${v.value}`}
                    stock={v.stock_quantity}
                    isPreorder={product.is_preorder}
                  />
                ))
              ) : (
                <InventoryRow
                  key={product.id}
                  id={product.id}
                  label={product.name}
                  stock={product.stock_quantity}
                  isPreorder={product.is_preorder}
                />
              )
            )}
          </tbody>
        </table>

        {displayProducts?.length === 0 && (
          <p className="text-center text-navy-400 text-sm py-12">Nothing to show here.</p>
        )}
      </div>
    </div>
  );
}