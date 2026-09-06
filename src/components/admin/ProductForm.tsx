"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiOutlineUpload, HiOutlineX, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";
import { url } from "zod/v4/mini";

type Category = { id: string; name: string };
type Variant = { id?: string; name: string; value: string; stock_quantity: number; price_adjustment: number };

type ExistingProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  stock_quantity: number;
  is_preorder: boolean;
  preorder_fulfillment_note: string | null;
  status: "active" | "draft" | "archived";
  product_images?: { image_url: string }[];
  product_variants?: Variant[];
};

export function ProductForm({
  categories,
  existingProduct,
}: {
  categories: Category[];
  existingProduct?: ExistingProduct;
}) {
  const router = useRouter();
  const isEditing = !!existingProduct;

  const [name, setName] = useState(existingProduct?.name ?? "");
  const [description, setDescription] = useState(existingProduct?.description ?? "");
  const [price, setPrice] = useState(existingProduct?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(existingProduct?.category_id ?? "");
  const [stockQuantity, setStockQuantity] = useState(existingProduct?.stock_quantity?.toString() ?? "0");
  const [isPreorder, setIsPreorder] = useState(existingProduct?.is_preorder ?? false);
  const [preorderNote, setPreorderNote] = useState(existingProduct?.preorder_fulfillment_note ?? "");
  const [status, setStatus] = useState(existingProduct?.status ?? "active");
  const [variants, setVariants] = useState<Variant[]>(existingProduct?.product_variants ?? []);

  const [imageUrls, setImageUrls] = useState<string[]>(
    existingProduct?.product_images?.map((img) => img.image_url) ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Image upload failed");
        continue;
      }
      setImageUrls((prev) => [...prev, data.url]);
    }

    setUploading(false);
    e.target.value = "";
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { name: "", value: "", stock_quantity: 0, price_adjustment: 0 }]);
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      description,
      price: Number(price),
      category_id: categoryId,
      stock_quantity: Number(stockQuantity),
      is_preorder: isPreorder,
      preorder_fulfillment_note: isPreorder ? preorderNote : undefined,
      status,
      images: imageUrls,
      variants,
    };

    const url = isEditing ? `/api/admin/products/${existingProduct.id}` : "/api/admin/products";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Something went wrong. Check the fields and try again.");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl w-full space-y-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>
      )}

      {/* Images */}
      <div>
        <label className="block text-sm text-navy-700 mb-2">Product images</label>
        <div className="flex flex-wrap gap-3 mb-3">
          {imageUrls.map((url) => (
            <div key={url} className="relative w-20 h-20">
              <Image src={url} alt="" fill className="object-cover rounded" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute -top-2 -right-2 bg-navy-900 text-white rounded-full w-5 h-5 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 border border-navy-200 border-dashed rounded px-4 py-2.5 text-sm text-navy-600 cursor-pointer hover:border-navy-400">
          <HiOutlineUpload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload images"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {uploading && <p className="text-xs text-navy-400 mt-1">Uploading...</p>}
      </div>

      {/* Basic info */}
      <div>
        <label className="block text-sm text-navy-700 mb-1">Product name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
        />
      </div>

      <div>
        <label className="block text-sm text-navy-700 mb-1">Description</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-navy-700 mb-1">Price (GH₵)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
          />
        </div>
        <div>
          <label className="block text-sm text-navy-700 mb-1">Category</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-navy-700 mb-1">Stock quantity</label>
          <input
            required
            type="number"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
          />
        </div>
        <div>
          <label className="block text-sm text-navy-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Preorder */}
      <div className="border border-navy-100 rounded p-4">
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            checked={isPreorder}
            onChange={(e) => setIsPreorder(e.target.checked)}
          />
          This is a preorder item (sourced per order)
        </label>
        {isPreorder && (
          <input
            placeholder="e.g. Ships in 2–3 weeks"
            value={preorderNote}
            onChange={(e) => setPreorderNote(e.target.value)}
            className="w-full border border-navy-100 rounded px-3 py-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-turquoise"
          />
        )}
      </div>

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-navy-700">Variants (optional — size, color, etc.)</label>
          <button type="button" onClick={addVariant} className="flex items-center gap-1 text-sm text-ocean hover:underline">
            <HiOutlinePlus className="w-4 h-4" /> Add variant
          </button>
        </div>
  {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2 items-center">
            <input
              placeholder="Name (e.g. Size)"
              value={v.name}
              onChange={(e) => updateVariant(i, "name", e.target.value)}
              className="border border-navy-100 rounded px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Value (e.g. L)"
              value={v.value}
              onChange={(e) => updateVariant(i, "value", e.target.value)}
              className="border border-navy-100 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="Stock"
              value={v.stock_quantity}
              onChange={(e) => updateVariant(i, "stock_quantity", Number(e.target.value))}
              className="border border-navy-100 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="+/- price"
              value={v.price_adjustment}
              onChange={(e) => updateVariant(i, "price_adjustment", Number(e.target.value))}
              className="border border-navy-100 rounded px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => removeVariant(i)} className="text-red-500 flex items-center gap-1 text-sm">
              <HiOutlineTrash className="w-4 h-4" /> <span className="sm:hidden">Remove</span>
            </button>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={submitting || uploading}
        className="bg-navy-800 text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-navy-700 transition disabled:opacity-50"
      >
        {submitting ? "Saving..." : isEditing ? "Save changes" : "Add product"}
      </button>
    </form>
  );
}