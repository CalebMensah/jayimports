"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiOutlineChevronDown, HiOutlineSearch } from "react-icons/hi";
import type { BatchOrderLine, ProductGroup } from "@/lib/batch-orders";
import { NO_OPTIONS } from "@/lib/batch-item";

function lineBadge(line: BatchOrderLine): string | null {
  if (line.counted) return null;
  if (line.status === "cancelled") return "Cancelled";
  if (line.paymentStatus === "failed") return "Payment failed";
  if (line.paymentStatus === "pending_confirmation") return "Awaiting payment";
  return "Unpaid";
}

export function BatchProducts({ groups }: { groups: ProductGroup[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();
  const defaultOpen = groups.length <= 5;

  const visible = groups
    .map((group) => {
      if (!q || group.name.toLowerCase().includes(q)) return group;
      const lines = group.lines.filter((line) =>
        `${line.orderNumber} ${line.customerName} ${line.customerPhone}`.toLowerCase().includes(q)
      );
      return lines.length > 0 ? { ...group, lines } : null;
    })
    .filter((group): group is ProductGroup => group !== null);

  const isOpen = (key: string) => open[key] ?? (q ? true : defaultOpen);
  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(groups.map((group) => [group.key, value])));

  if (groups.length === 0) {
    return (
      <p className="text-center text-navy-400 text-sm py-12 bg-white border border-navy-100 rounded">
        No orders to show here yet.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product, customer, phone or order number"
            className="w-full border border-navy-100 rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
          />
        </div>
        <button
          type="button"
          onClick={() => setAll(true)}
          className="text-xs border border-navy-200 rounded px-3 py-2 text-navy-600 hover:bg-navy-50"
        >
          Expand all
        </button>
        <button
          type="button"
          onClick={() => setAll(false)}
          className="text-xs border border-navy-200 rounded px-3 py-2 text-navy-600 hover:bg-navy-50"
        >
          Collapse all
        </button>
      </div>

      {visible.length === 0 && (
        <p className="text-center text-navy-400 text-sm py-10 bg-white border border-navy-100 rounded">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      )}

      <div className="space-y-3">
        {visible.map((group) => {
          const expanded = isOpen(group.key);
          const showVariants =
            group.quantity > 0 &&
            !(group.variants.length === 1 && group.variants[0].label === NO_OPTIONS);

          return (
            <div key={group.key} className="bg-white border border-navy-100 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen((prev) => ({ ...prev, [group.key]: !expanded }))}
                aria-expanded={expanded}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-50/50 transition"
              >
                <div className="relative w-12 h-12 shrink-0 rounded bg-navy-50 overflow-hidden">
                  {group.image && (
                    <Image src={group.image} alt="" fill className="object-cover" sizes="48px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-900 truncate">{group.name}</p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {group.quantity} unit{group.quantity === 1 ? "" : "s"} · {group.orderCount} order
                    {group.orderCount === 1 ? "" : "s"} · GH₵{group.revenue.toFixed(2)}
                  </p>
                </div>
                <HiOutlineChevronDown
                  className={`w-4 h-4 text-navy-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </button>

              {expanded && (
                <div className="border-t border-navy-50">
                  {showVariants && (
                    <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                      {group.variants.map((variant) => (
                        <span
                          key={variant.label}
                          className="text-xs bg-navy-50 text-navy-700 rounded px-2 py-1"
                        >
                          {variant.label} × {variant.quantity}
                        </span>
                      ))}
                    </div>
                  )}

                  <ul className="divide-y divide-navy-50 mt-2">
                    {group.lines.map((line, i) => {
                      const badge = lineBadge(line);
                      return (
                        <li
                          key={`${line.orderId}-${line.label}-${i}`}
                          className={`px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${
                            line.counted ? "" : "opacity-60"
                          }`}
                        >
                          <Link
                            href={`/admin/orders/${line.orderId}`}
                            className="text-ocean hover:underline font-medium"
                          >
                            {line.orderNumber}
                          </Link>
                          <span className="text-navy-700">{line.customerName}</span>
                          {line.customerPhone && (
                            <span className="text-xs text-navy-400">{line.customerPhone}</span>
                          )}
                          <span className="text-xs text-navy-500 sm:ml-auto">
                            {line.label !== NO_OPTIONS ? `${line.label} · ` : ""}× {line.quantity}
                          </span>
                          <span className="text-navy-900">GH₵{line.amount.toFixed(2)}</span>
                          {badge && (
                            <span className="text-[10px] bg-navy-50 text-navy-500 rounded px-1.5 py-0.5">
                              {badge}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
