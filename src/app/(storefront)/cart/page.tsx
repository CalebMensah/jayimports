"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { HiOutlineShoppingBag, HiOutlineTrash, HiOutlineMinus, HiOutlinePlus } from "react-icons/hi";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-20 text-center">
        <HiOutlineShoppingBag className="w-10 h-10 text-navy-200 mx-auto mb-3" />
        <p className="text-navy-500 mb-4">Your cart is empty.</p>
        <Link href="/shop" className="text-ocean hover:underline">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10 pb-32 md:pb-10">
      <h1 className="font-display text-xl md:text-2xl text-navy-900 mb-6">Your cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex gap-3 md:gap-4 border-b border-navy-100 pb-4">
            <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white border border-navy-100 shrink-0">
              {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-navy-900 truncate">{item.name}</p>
              {item.variantLabel && <p className="text-xs text-navy-400">{item.variantLabel}</p>}
              <p className="text-sm text-navy-500 mt-1">GH₵{item.price.toFixed(2)}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center border border-navy-100 rounded">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                    className="px-2 py-1 text-navy-600"
                    aria-label="Decrease quantity"
                  >
                    <HiOutlineMinus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                    className="px-2 py-1 text-navy-600"
                    aria-label="Increase quantity"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-red-500 hover:text-red-600"
                  aria-label="Remove item"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-navy-900 shrink-0">GH₵{(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between text-base md:text-lg">
        <span className="text-navy-700">Subtotal</span>
        <span className="text-navy-900 font-medium">GH₵{subtotal.toFixed(2)}</span>
      </div>

      <Link
        href="/checkout"
        className="hidden md:block text-center mt-6 bg-navy-800 text-white py-3 rounded text-sm font-medium hover:bg-navy-700 transition"
      >
        Proceed to checkout
      </Link>

      {/* Mobile sticky checkout bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-navy-100 p-4 z-40">
        <Link
          href="/checkout"
          className="block text-center bg-navy-800 text-white py-3 rounded text-sm font-medium"
        >
          Checkout · GH₵{subtotal.toFixed(2)}
        </Link>
      </div>
    </div>
  );
}