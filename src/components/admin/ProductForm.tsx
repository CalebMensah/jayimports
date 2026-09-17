"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiOutlineUpload, HiOutlineX, HiOutlinePlus, HiOutlineTrash, HiOutlinePhotograph } from "react-icons/hi";

type Category = { id: string; name: string };
type ColorRow = { client_id: string; color_name: string; image_url: string };
type SizeRow = { client_id: string; size_value: string; price_adjustment: number };

type ExistingProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  moq: number;
  preorder_fulfillment_note: string | null;
  status: "active" | "draft" | "archived";
  product_images?: { image_url: string }[];
  product_colors?: { id: string; color_name: string; image_url: string }[];
  product_sizes?: { id: string; size_value: string; price_adjustment: number }[];
};

function makeClientId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const data = await res.json();
  return res.ok ? data.url : null;
}

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
  const [moq, setMoq] = useState(existingProduct?.moq?.toString() ?? "1");
  const [preorderNote, setPreorderNote] = useState(existingProduct?.preorder_fulfillment_note ?? "");
  const [status, setStatus] = useState(existingProduct?.status ?? "active");

  const [imageUrls, setImageUrls] = useState<string[]>(
    existingProduct?.product_images?.map((img) => img.image_url) ?? []
  );
  const [colors, setColors] = useState<ColorRow[]>(
    existingProduct?.product_colors?.map((c) => ({ client_id: c.id, color_name: c.color_name, image_url: c.image_url })) ?? []
  );
  const [sizes, setSizes] = useState<SizeRow[]>(
    existingProduct?.product_sizes?.map((s) => ({ client_id: s.id, size_value: s.size_value, price_adjustment: s.price_adjustment })) ?? []
  );

  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [uploadingColorId, setUploadingColorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasColors = colors.length > 0;

  async function handleProductImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingProductImages(true);
    setError(null);
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) setImageUrls((prev) => [...prev, url]);
      else setError("Image upload failed");
    }
    setUploadingProductImages(false);
    e.target.value = "";
  }

  function removeProductImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  function addColor() {
    setColors((prev) => [...prev, { client_id: makeClientId(), color_name: "", image_url: "" }]);
  }

  async function handleColorImageSelect(clientId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingColorId(clientId);
    const url = await uploadImage(file);
    setUploadingColorId(null);
    if (url) setColors((prev) => prev.map((c) => (c.client_id === clientId ? { ...c, image_url: url } : c)));
    else setError("Image upload failed");
    e.target.value = "";
  }

  function updateColorName(clientId: string, value: string) {
    setColors((prev) => prev.map((c) => (c.client_id === clientId ? { ...c, color_name: value } : c)));
  }

  function removeColor(clientId: string) {
    setColors((prev) => prev.filter((c) => c.client_id !== clientId));
  }

  function addSize() {
    setSizes((prev) => [...prev, { client_id: makeClientId(), size_value: "", price_adjustment: 0 }]);
  }

  function updateSize(clientId: string, field: "size_value" | "price_adjustment", value: string | number) {
    setSizes((prev) => prev.map((s) => (s.client_id === clientId ? { ...s, [field]: value } : s)));
  }

  function removeSize(clientId: string) {
    setSizes((prev) => prev.filter((s) => s.client_id !== clientId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (hasColors && colors.some((c) => !c.image_url || !c.color_name.trim())) {
      setError("Every color needs a name and an uploaded photo");
      setSubmitting(false);
      return;
    }

    const payload = {
      name,
      description,
      price: Number(price),
      category_id: categoryId,
      moq: Number(moq),
      preorder_fulfillment_note: preorderNote || undefined,
      status,
      images: imageUrls,
      colors: hasColors ? colors : [],
      sizes: hasColors ? sizes : [],
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
      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}

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
          <label className="block text-sm text-navy-700 mb-1">Base price (GH₵)</label>
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
          <label className="block text-sm text-navy-700 mb-1">Minimum order quantity (MOQ)</label>
          <input
            required
            type="number"
            min="1"
            value={moq}
            onChange={(e) => setMoq(e.target.value)}
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

      <div className="border border-turquoise/30 bg-turquoise/5 rounded p-4">
        <p className="text-sm text-navy-700 font-medium mb-1">This product is a preorder item</p>
        <p className="text-xs text-navy-400 mb-3">
          Every product on this store is sourced per order — there&apos;s no separate in-stock option.
        </p>
        <label className="block text-sm text-navy-700 mb-1">Estimated delivery time</label>
        <input
          placeholder="e.g. Ships in 2–3 weeks"
          value={preorderNote}
          onChange={(e) => setPreorderNote(e.target.value)}
          className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
        />
      </div>

      <div className="border border-navy-100 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-navy-700">Colors (optional)</p>
            <p className="text-xs text-navy-400">Add a photo per color instead of typing color names</p>
          </div>
          <button type="button" onClick={addColor} className="flex items-center gap-1 text-sm text-ocean hover:underline">
            <HiOutlinePlus className="w-4 h-4" /> Add color
          </button>
        </div>

        {colors.length === 0 && (
          <p className="text-xs text-navy-400">No colors added — this product will use the plain image gallery below instead.</p>
        )}

        <div className="space-y-3">
          {colors.map((color) => (
            <div key={color.client_id} className="flex items-center gap-3">
              <label className="relative w-14 h-14 shrink-0 border border-navy-200 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-navy-400 overflow-hidden">
                {color.image_url ? (
                  <Image src={color.image_url} alt="" fill className="object-cover" sizes="56px" />
                ) : (
                  <HiOutlinePhotograph className="w-5 h-5 text-navy-300" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleColorImageSelect(color.client_id, e)}
                  disabled={uploadingColorId === color.client_id}
                  className="hidden"
                />
              </label>
              <input
                placeholder="Color name (e.g. Red)"
                value={color.color_name}
                onChange={(e) => updateColorName(color.client_id, e.target.value)}
                className="flex-1 border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
              />
              {uploadingColorId === color.client_id && <span className="text-xs text-navy-400">Uploading...</span>}
              <button type="button" onClick={() => removeColor(color.client_id)} className="text-red-500" aria-label="Remove color">
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {hasColors && (
        <div className="border border-navy-100 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-navy-700">Sizes</p>
              <p className="text-xs text-navy-400">Shared across every color — set a price adjustment if a size costs more</p>
            </div>
            <button type="button" onClick={addSize} className="flex items-center gap-1 text-sm text-ocean hover:underline">
              <HiOutlinePlus className="w-4 h-4" /> Add size
            </button>
          </div>

          <div className="space-y-2">
            {sizes.map((size) => (
              <div key={size.client_id} className="flex items-center gap-2">
                <input
                  placeholder="Size (e.g. 42)"
                  value={size.size_value}
                  onChange={(e) => updateSize(size.client_id, "size_value", e.target.value)}
                  className="flex-1 border border-navy-100 rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="+/- price"
                  value={size.price_adjustment}
                  onChange={(e) => updateSize(size.client_id, "price_adjustment", Number(e.target.value))}
                  className="w-28 border border-navy-100 rounded px-3 py-2 text-sm"
                />
                <button type="button" onClick={() => removeSize(size.client_id)} className="text-red-500" aria-label="Remove size">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
            {sizes.length === 0 && <p className="text-xs text-navy-400">No sizes yet.</p>}
          </div>
        </div>
      )}

      {!hasColors && (
        <div>
          <label className="block text-sm text-navy-700 mb-2">Product images</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {imageUrls.map((url) => (
              <div key={url} className="relative w-20 h-20">
                <Image src={url} alt="" fill className="object-cover rounded" sizes="80px" />
                <button
                  type="button"
                  onClick={() => removeProductImage(url)}
                  className="absolute -top-2 -right-2 bg-navy-900 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  aria-label="Remove image"
                >
                  <HiOutlineX className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 border border-navy-200 border-dashed rounded px-4 py-2.5 text-sm text-navy-600 cursor-pointer hover:border-navy-400">
            <HiOutlineUpload className="w-4 h-4" />
            {uploadingProductImages ? "Uploading..." : "Upload images"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleProductImageSelect}
              disabled={uploadingProductImages}
              className="hidden"
            />
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-navy-800 text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-navy-700 transition disabled:opacity-50"
      >
        {submitting ? "Saving..." : isEditing ? "Save changes" : "Add product"}
      </button>
    </form>
  );
}
