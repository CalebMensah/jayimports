"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { POLICIES } from "@/lib/constants";
import { HiOutlineClock, HiOutlineCheck, HiOutlineShoppingBag, HiOutlineMinus, HiOutlinePlus } from "react-icons/hi";

type Variant = { id: string; name: string; value: string; stock_quantity: number; price_adjustment: number };
type ProductImage = { image_url: string; sort_order: number };

export function ProductDetail({
  product,
}: {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock_quantity: number;
    is_preorder: boolean;
    preorder_fulfillment_note: string | null;
    product_images: ProductImage[];
    product_variants: Variant[];
  };
}) {
  const { addItem } = useCart();
  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.product_variants[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const effectivePrice = product.price + (selectedVariant?.price_adjustment ?? 0);
  const effectiveStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const isSoldOut = !product.is_preorder && effectiveStock === 0;

  const variantGroups = product.product_variants.reduce<Record<string, Variant[]>>((acc, v) => {
    (acc[v.name] ??= []).push(v);
    return acc;
  }, {});

  function handleAddToCart() {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantLabel: selectedVariant?.value,
      price: effectivePrice,
      image: images[0]?.image_url ?? null,
      quantity,
      isPreorder: product.is_preorder,
      maxStock: product.is_preorder ? 999 : effectiveStock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 grid md:grid-cols-2 gap-6 md:gap-10 pb-28 md:pb-10">
      {/* Images */}
      <div>
        <div className="relative aspect-square bg-white border border-navy-100 mb-3">
          {images[activeImage] && (
            <Image src={images[activeImage].image_url} alt={product.name} fill className="object-cover" priority />
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.image_url}
                onClick={() => setActiveImage(i)}
                className={`relative w-14 h-14 md:w-16 md:h-16 shrink-0 border ${i === activeImage ? "border-navy-800" : "border-navy-100"}`}
              >
                <Image src={img.image_url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {product.is_preorder && (
          <span className="inline-flex items-center gap-1 bg-turquoise-dark text-white text-xs px-2 py-1 rounded mb-3">
            <HiOutlineClock className="w-3.5 h-3.5" />
            Preorder{product.preorder_fulfillment_note ? ` — ${product.preorder_fulfillment_note}` : ""}
          </span>
        )}
        <h1 className="font-display text-2xl md:text-3xl text-navy-900">{product.name}</h1>
        <p className="text-lg md:text-xl text-navy-700 mt-2">GH₵{effectivePrice.toFixed(2)}</p>

        {!product.is_preorder && (
          <p className={`text-sm mt-1 ${effectiveStock <= 3 && effectiveStock > 0 ? "text-red-600" : "text-navy-400"}`}>
            {effectiveStock === 0 ? "Sold out" : effectiveStock <= 3 ? `Only ${effectiveStock} left` : "In stock"}
          </p>
        )}

        {product.description && (
          <p className="text-navy-600 mt-4 leading-relaxed text-sm md:text-base">{product.description}</p>
        )}

        {Object.entries(variantGroups).map(([groupName, options]) => (
          <div key={groupName} className="mt-5">
            <p className="text-sm text-navy-700 mb-2">{groupName}</p>
            <div className="flex gap-2 flex-wrap">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedVariant(opt)}
                  disabled={!product.is_preorder && opt.stock_quantity === 0}
                  className={`text-sm px-3 py-1.5 rounded border transition disabled:opacity-30 disabled:cursor-not-allowed ${
                    selectedVariant?.id === opt.id
                      ? "border-navy-800 bg-navy-800 text-white"
                      : "border-navy-100 text-navy-700 hover:border-navy-300"
                  }`}
                >
                  {opt.value}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-5 flex items-center gap-3">
          <p className="text-sm text-navy-700">Quantity</p>
          <div className="flex items-center border border-navy-100 rounded">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-navy-600" aria-label="Decrease quantity">
              <HiOutlineMinus className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => (product.is_preorder ? q + 1 : Math.min(q + 1, effectiveStock)))}
              className="px-3 py-1.5 text-navy-600"
              aria-label="Increase quantity"
            >
              <HiOutlinePlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop add-to-cart (hidden on mobile, replaced by sticky bar below) */}
        <button
          onClick={handleAddToCart}
          disabled={isSoldOut}
          className="hidden md:flex mt-6 items-center justify-center gap-2 bg-navy-800 text-white px-8 py-3 rounded text-sm font-medium hover:bg-navy-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSoldOut ? null : added ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineShoppingBag className="w-4 h-4" />}
          {isSoldOut ? "Sold out" : added ? "Added" : product.is_preorder ? "Preorder now" : "Add to cart"}
        </button>

        {product.is_preorder && (
          <p className="text-xs text-navy-400 mt-4 leading-relaxed">{POLICIES.preorder}</p>
        )}
      </div>

      {/* Mobile sticky add-to-cart bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-navy-100 p-4 z-40">
        <button
          onClick={handleAddToCart}
          disabled={isSoldOut}
          className="w-full flex items-center justify-center gap-2 bg-navy-800 text-white py-3 rounded text-sm font-medium disabled:opacity-40"
        >
          {isSoldOut ? null : added ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineShoppingBag className="w-4 h-4" />}
          {isSoldOut ? "Sold out" : added ? "Added" : product.is_preorder ? "Preorder now" : `Add to cart · GH₵${(effectivePrice * quantity).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}