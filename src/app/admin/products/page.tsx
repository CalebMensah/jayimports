import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/admin/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { HiOutlinePlus } from "react-icons/hi";

export default async function ProductsListPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, stock_quantity, is_preorder, status, product_images(image_url, sort_order)")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage what's for sale in your store"
        action={
          <Link
            href="/admin/products/new"
            className="bg-navy-800 text-white text-sm px-4 py-2 rounded hover:bg-navy-700 transition flex items-center gap-2"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add product
          </Link>
        }
      />

      <div className="bg-white border border-navy-100 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-navy-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => {
              const image = product.product_images?.sort((a, b) => a.sort_order - b.sort_order)[0];
              return (
                <tr key={product.id} className="border-t border-navy-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {image ? (
                      <Image
                        src={image.image_url}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded object-cover w-10 h-10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-navy-50" />
                    )}
                    <span className="text-navy-900">{product.name}</span>
                  </td>
                  <td className="px-4 py-3 text-navy-700">GH₵{product.price}</td>
                  <td className="px-4 py-3">
                    <span className={product.stock_quantity <= 3 ? "text-red-600 font-medium" : "text-navy-700"}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-700">
                    {product.is_preorder ? "Preorder" : "In stock"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        product.status === "active"
                          ? "bg-turquoise/10 text-turquoise-dark"
                          : "bg-navy-50 text-navy-400"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-ocean hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products?.length === 0 && (
          <p className="text-center text-navy-400 text-sm py-12">
            No products yet — add your first one to get started.
          </p>
        )}
      </div>
    </div>
  );
}