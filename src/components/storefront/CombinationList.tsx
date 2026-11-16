import Image from "next/image";
import { HiOutlineMinus, HiOutlinePlus, HiOutlineX } from "react-icons/hi";

export type CombinationRow = {
  key: string;
  label: string;
  price: number;
  image: string | null;
  inCart: number;
  qty: number;
  min: number;
};

export function CombinationList({
  rows,
  onStep,
  onRemove,
}: {
  rows: CombinationRow[];
  onStep: (key: string, delta: 1 | -1) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex items-center gap-3 rounded border border-navy-100 bg-white px-3 py-2"
        >
          {row.image && (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-navy-50">
              <Image src={row.image} alt="" fill className="object-cover" sizes="40px" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm text-navy-800 break-words">{row.label}</p>
            <p className="text-xs text-navy-400">
              GH₵{row.price.toFixed(2)}
              {row.inCart > 0 ? ` · ${row.inCart} already in cart` : ""}
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center rounded-full border border-navy-100">
            <button
              type="button"
              onClick={() => onStep(row.key, -1)}
              disabled={row.qty <= row.min}
              className="px-2.5 py-1.5 text-navy-600 disabled:opacity-30"
              aria-label={`Decrease quantity of ${row.label}`}
            >
              <HiOutlineMinus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm tabular-nums">{row.qty}</span>
            <button
              type="button"
              onClick={() => onStep(row.key, 1)}
              className="px-2.5 py-1.5 text-navy-600"
              aria-label={`Increase quantity of ${row.label}`}
            >
              <HiOutlinePlus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(row.key)}
            className="shrink-0 rounded-full p-1 text-navy-300 hover:text-red-500"
            aria-label={`Remove ${row.label}`}
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
