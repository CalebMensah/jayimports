"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { POLICIES } from "@/lib/constants";
import { HiOutlineClock, HiOutlineCheck, HiOutlineShoppingBag, HiOutlineMinus, HiOutlinePlus } from "react-icons/hi";

type ProductImage = { image_url: string; sort_order: number };
type ProductColor = { id: string; color_name: string; image_url: string; sort_order: number };
type ProductSize = { id: string; size_value: string; price_adjustment: number; sort_order: number };
type StockRow = { color_id: string; size_id: string; stock_quantity: number };

export function ProductDetail({
  product,
}: {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock_quantity: number;
    moq: number;
    is_preorder: boolean;
    preorder_fulfillment_note: string | null;
    product_images: ProductImage[];
    product_colors: ProductColor[];
    product_sizes: ProductSize[];
    product_color_size_stock: StockRow[];
  };
}) {
  const { addItem } = useCart();
  const hasColors = product.product_colors.length > 0;

  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const colors = [...product.product_colors].sort((a, b) => a.sort_order - b.sort_order);
  const sizes = [...product.product_sizes].sort((a, b) => a.sort_order - b.sort_order);

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(colors[0] ?? null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(sizes[0] ?? null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(product.moq);
  const [added, setAdded] = useState(false);

  const stockForSelection = useMemo(() => {
    if (!hasColors) return product.stock_quantity;
    if (!selectedColor || !selectedSize) return 0;
    const row = product.product_color_size_stock.find(
      (s) => s.color_id === selectedColor.id && s.size_id === selectedSize.id
    );
    return row?.stock_quantity ?? 0;
  }, [hasColors, selectedColor, selectedSize, product.product_color_size_stock, product.stock_quantity]);

  const effectivePrice = product.price + (hasColors ? (selectedSize?.price_adjustment ?? 0) : 0);
  const isSoldOut = !product.is_preorder && stockForSelection <= 0;

  const displayedImage = hasColors ? selectedColor?.image_url : images[activeImage]?.image_url;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      variantId: hasColors && selectedColor && selectedSize ? `${selectedColor.id}::${selectedSize.id}` : undefined,
      colorId: selectedColor?.id,
      sizeId: selectedSize?.id,
      name: product.name,
      variantLabel: hasColors ? `${selectedColor?.color_name} / ${selectedSize?.size_value}` : undefined,
      price: effectivePrice,
      image: displayedImage ?? null,
      quantity,
      isPreorder: product.is_preorder,
      maxStock: product.is_preorder ? 999 : stockForSelection,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 grid md:grid-cols-2 gap-6 md:gap-10 pb-28 md:pb-10">
      {/* Image */}
      <div>
        <div className="relative aspect-square bg-white border border-navy-100 mb-3">
          {displayedImage && (
            <Image src={displayedImage} alt={product.name} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
          )}
        </div>
        {!hasColors && images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.image_url}
                onClick={() => setActiveImage(i)}
                className={`relative w-14 h-14 shrink-0 border ${i === activeImage ? "border-navy-800" : "border-navy-100"}`}
              >
                <Image src={img.image_url} alt="" fill className="object-cover" sizes="56px" />
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
          <p className={`text-sm mt-1 ${stockForSelection <= 3 && stockForSelection > 0 ? "text-red-600" : "text-navy-400"}`}>
            {stockForSelection <= 0 ? "Sold out" : stockForSelection <= 3 ? `Only ${stockForSelection} left` : "In stock"}
          </p>
        )}

        {product.moq > 1 && (
          <p className="text-xs text-navy-400 mt-1">Minimum order: {product.moq}</p>
        )}

        {product.description && (
          <p className="text-navy-600 mt-4 leading-relaxed text-sm md:text-base">{product.description}</p>
        )}

        {/* Color swatches */}
        {hasColors && (
          <div className="mt-5">
            <p className="text-sm text-navy-700 mb-2">
              Color{selectedColor ? `: ${selectedColor.color_name}` : ""}
            </p>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color)}
                  className={`relative w-14 h-14 rounded border-2 overflow-hidden ${
                    selectedColor?.id === color.id ? "border-navy-800" : "border-navy-100"
                  }`}
                  aria-label={color.color_name}
                >
                  <Image src={color.image_url} alt={color.color_name} fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sizes */}
        {hasColors && sizes.length > 0 && (
          <div className="mt-5">
            <p className="text-sm text-navy-700 mb-2">Size</p>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((size) => {
                const stockRow = selectedColor
                  ? product.product_color_size_stock.find((s) => s.color_id === selectedColor.id && s.size_id === size.id)
                  : null;
                const outOfStock = !product.is_preorder && (stockRow?.stock_quantity ?? 0) <= 0;
                return (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    disabled={outOfStock}
                    className={`text-sm px-3 py-1.5 rounded border transition disabled:opacity-30 disabled:cursor-not-allowed ${
                      selectedSize?.id === size.id
                        ? "border-navy-800 bg-navy-800 text-white"
                        : "border-navy-100 text-navy-700 hover:border-navy-300"
                    }`}
                  >
                    {size.size_value}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity — floors at MOQ */}
        <div className="mt-5 flex items-center gap-3">
          <p className="text-sm text-navy-700">Quantity</p>
          <div className="flex items-center border border-navy-100 rounded">
            <button
              onClick={() => setQuantity((q) => Math.max(product.moq, q - 1))}
              className="px-3 py-1.5 text-navy-600"
              aria-label="Decrease quantity"
            >
              <HiOutlineMinus className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => (product.is_preorder ? q + 1 : Math.min(q + 1, stockForSelection)))}
              className="px-3 py-1.5 text-navy-600"
              aria-label="Increase quantity"
            >
              <HiOutlinePlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isSoldOut || (hasColors && (!selectedColor || !selectedSize))}
          className="hidden md:flex mt-6 items-center justify-center gap-2 bg-navy-800 text-white px-8 py-3 rounded text-sm font-medium hover:bg-navy-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSoldOut ? null : added ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineShoppingBag className="w-4 h-4" />}
          {isSoldOut ? "Sold out" : added ? "Added" : product.is_preorder ? "Preorder now" : "Add to cart"}
        </button>

        {product.is_preorder && (
          <p className="text-xs text-navy-400 mt-4 leading-relaxed">{POLICIES.preorder}</p>
        )}
      </div>

      {/* Mobile sticky bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-navy-100 p-4 z-40">
        <button
          onClick={handleAddToCart}
          disabled={isSoldOut || (hasColors && (!selectedColor || !selectedSize))}
          className="w-full flex items-center justify-center gap-2 bg-navy-800 text-white py-3 rounded text-sm font-medium disabled:opacity-40"
        >
          {isSoldOut ? null : added ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineShoppingBag className="w-4 h-4" />}
          {isSoldOut ? "Sold out" : added ? "Added" : product.is_preorder ? "Preorder now" : `Add to cart · GH₵${(effectivePrice * quantity).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}