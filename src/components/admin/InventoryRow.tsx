"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePencil, HiOutlineCheck, HiOutlineX } from "react-icons/hi";

type PlainRowProps = {
  variant: "product";
  productId: string;
  label: string;
  stock: number;
  isPreorder: boolean;
};

type ColorSizeRowProps = {
  variant: "color_size";
  stockId: string;
  label: string;
  sublabel: string;
  stock: number;
  isPreorder: boolean;
};

export function InventoryRow(props: PlainRowProps | ColorSizeRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(props.stock.toString());
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    const payload =
      props.variant === "product"
        ? { type: "product" as const, productId: props.productId, newQuantity: Number(value) }
        : { type: "color_size" as const, stockId: props.stockId, newQuantity: Number(value) };

    const res = await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
        <p className="text-navy-900 text-sm">{props.label}</p>
        {props.variant === "color_size" && <p className="text-navy-400 text-xs">{props.sublabel}</p>}
      </td>
      <td className="px-4 py-3">
        {props.isPreorder ? (
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
            <button
              onClick={() => { setEditing(false); setValue(props.stock.toString()); }}
              className="text-navy-400"
              aria-label="Cancel"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={props.stock <= 3 ? "text-red-600 font-medium" : "text-navy-700"}>{props.stock}</span>
            <button onClick={() => setEditing(true)} className="text-navy-300 hover:text-navy-600" aria-label="Edit stock">
              <HiOutlinePencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}