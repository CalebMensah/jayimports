"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePencil, HiOutlineCheck, HiOutlineX } from "react-icons/hi";

export function InventoryRow({
  id,
  variantId,
  label,
  sublabel,
  stock,
  isPreorder,
}: {
  id: string;
  variantId?: string;
  label: string;
  sublabel?: string;
  stock: number;
  isPreorder: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stock.toString());
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, variantId, newQuantity: Number(value) }),
    });
    setSaving(false);

    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  return (
    <tr className="border-t border-navy-50">
      <td className="px-4 py-3">
        <p className="text-navy-900 text-sm">{label}</p>
        {sublabel && <p className="text-navy-400 text-xs">{sublabel}</p>}
      </td>
      <td className="px-4 py-3">
        {isPreorder ? (
          <span className="text-xs text-navy-400">Preorder — no cap</span>
        ) : editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-20 border border-navy-200 rounded px-2 py-1 text-sm"
              autoFocus
            />
            <button onClick={handleSave} disabled={saving} className="text-turquoise-dark" aria-label="Save">
              <HiOutlineCheck className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditing(false); setValue(stock.toString()); }} className="text-navy-400" aria-label="Cancel">
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={stock <= 3 ? "text-red-600 font-medium" : "text-navy-700"}>{stock}</span>
            <button onClick={() => setEditing(true)} className="text-navy-300 hover:text-navy-600" aria-label="Edit stock">
              <HiOutlinePencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}