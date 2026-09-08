"use client";

import { useState } from "react";
import { HiOutlineExclamation, HiOutlineClipboardCopy, HiOutlineCheck } from "react-icons/hi";

export function OrderNumberSaveNotice({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — copy button just won't confirm, no crash
    }
  }

  return (
    <div className="border border-amber-200 bg-amber-50 rounded p-4 mb-6 text-left">
      <div className="flex items-start gap-2">
        <HiOutlineExclamation className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-800 font-medium">Save this order number</p>
          <p className="text-xs text-amber-700 mt-1">
            You&apos;ll need it to track your order later — screenshot this page or copy the number below. We can&apos;t look up your order without it.
          </p>
          <button
            onClick={handleCopy}
            className="mt-3 flex items-center gap-2 bg-white border border-amber-300 rounded px-3 py-2 text-sm text-navy-900 hover:bg-amber-100 transition w-full justify-center"
          >
            <span className="font-mono">{orderNumber}</span>
            {copied ? (
              <HiOutlineCheck className="w-4 h-4 text-turquoise-dark shrink-0" />
            ) : (
              <HiOutlineClipboardCopy className="w-4 h-4 text-navy-400 shrink-0" />
            )}
          </button>
          {copied && <p className="text-xs text-turquoise-dark mt-1">Copied to clipboard</p>}
        </div>
      </div>
    </div>
  );
}