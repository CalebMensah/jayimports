"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineTrash } from "react-icons/hi";

export function ProductRowActions({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${productName}"? It will be removed from the store, but past orders that included it stay intact.`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    setDeleting(false);

    if (res.ok) {
      router.refresh();
    } else {
      alert("Could not delete product. Please try again.");
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <Link href={`/admin/products/${productId}`} className="text-ocean hover:underline">
        Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-navy-300 hover:text-red-500 disabled:opacity-50"
        aria-label="Delete product"
      >
        <HiOutlineTrash className="w-4 h-4" />
      </button>
    </div>
  );
}
