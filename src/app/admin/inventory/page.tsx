import { PageHeader } from "@/components/admin/PageHeader";
import { InventoryRow } from "@/components/admin/InventoryRow";
import { createClient } from "@/lib/supabase/server";
import { HiOutlineExclamation } from "react-icons/hi";
import { Key } from "react";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("products")
    .select(`
      id, name, stock_quantity, is_preorder,
      product_colors(id, color_name, product_color_size_stock(id, size_id, stock_quantity)),
      product_sizes(id, size_value)
    `)
    .neq("status", "archived")
    .order("name");

  const products = raw?.map((p: any) => ({
    ...p,
    product_color_size_stock: p.product_colors.flatMap((c: any) =>
      (c.product_color_size_stock ?? []).map((s: any) => ({
        id: s.id,
        color_id: c.id,
        size_id: s.size_id,
        stock_quantity: s.stock_quantity,
      }))
    ),
  }));

  const lowStockCount =
    products?.filter((p) => {
      if (p.is_preorder) return false;
      if (p.product_colors.length === 0) return p.stock_quantity <= 3;
      return p.product_color_size_stock.some((s: any) => s.stock_quantity <= 3);
    }).length ?? 0;

  const displayProducts =
    filter === "low"
      ? products?.filter((p) => {
          if (p.is_preorder) return false;
          if (p.product_colors.length === 0) return p.stock_quantity <= 3;
          return p.product_color_size_stock.some((s: any) => s.stock_quantity <= 3);
        })
      : products;

  return (
    <div>
      <PageHeader title="Inventory" description="Stock levels across all products" />

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
            {displayProducts?.map((product) => {
              const colorMap = new Map(product.product_colors.map((c: { id: any; color_name: any; }) => [c.id, c.color_name]));
              const sizeMap = new Map(product.product_sizes.map((s: { id: any; size_value: any; }) => [s.id, s.size_value]));

              if (product.product_colors.length > 0) {
                // Color+size stock rows — only show rows that are low when filtering
                const rows = filter === "low"
                  ? product.product_color_size_stock.filter((s: { stock_quantity: number; }) => s.stock_quantity <= 3)
                  : product.product_color_size_stock;

                return rows.map((stockRow: { id: Key | null | undefined; color_id: unknown; size_id: unknown; stock_quantity: number; }) => (
                  <InventoryRow
                    key={stockRow.id}
                    variant="color_size"
                    stockId={String(stockRow.id)}
                    label={product.name}
                    sublabel={`${colorMap.get(stockRow.color_id) ?? "—"} / ${sizeMap.get(stockRow.size_id) ?? "—"}`}
                    stock={stockRow.stock_quantity}
                    isPreorder={product.is_preorder}
                  />
                ));
              }

              return (
                <InventoryRow
                  key={product.id}
                  variant="product"
                  productId={product.id}
                  label={product.name}
                  stock={product.stock_quantity}
                  isPreorder={product.is_preorder}
                />
              );
            })}
          </tbody>
        </table>

        {displayProducts?.length === 0 && (
          <p className="text-center text-navy-400 text-sm py-12">Nothing to show here.</p>
        )}
      </div>
    </div>
  );
}