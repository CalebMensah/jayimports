"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePlus, HiOutlineX, HiOutlineClock } from "react-icons/hi";

type Batch = {
  id: string;
  name: string;
  status: "open" | "closed";
  target_closes_at: string | null;
  closed_at: string | null;
  orders: { count: number }[];
};

export function BatchManager({ batches, waitingCount }: { batches: Batch[]; waitingCount: number }) {
  const router = useRouter();
  const openBatch = batches.find((b) => b.status === "open");

  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenBatch(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const res = await fetch("/api/admin/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, target_closes_at: targetDate || undefined }),
    });
    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not open batch");
      return;
    }

    setName("");
    setTargetDate("");
    router.refresh();
  }

  async function handleCloseBatch() {
    if (!openBatch) return;
    if (!confirm(`Close "${openBatch.name}"? New orders will wait for the next batch.`)) return;
    setClosing(true);
    const res = await fetch(`/api/admin/batches/${openBatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    setClosing(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}

      {openBatch ? (
        <div className="bg-white border border-turquoise/30 rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-turquoise-dark font-medium mb-1">CURRENTLY OPEN</p>
              <p className="text-navy-900 font-medium">{openBatch.name}</p>
              {openBatch.target_closes_at && (
                <p className="text-xs text-navy-400 mt-1">
                  Target close: {new Date(openBatch.target_closes_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
              <p className="text-xs text-navy-400 mt-1">{openBatch.orders?.[0]?.count ?? 0} orders in this batch</p>
            </div>
            <button
              onClick={handleCloseBatch}
              disabled={closing}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 text-sm px-3 py-1.5 rounded hover:bg-red-50 transition disabled:opacity-50"
            >
              <HiOutlineX className="w-4 h-4" /> Close batch
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-navy-100 rounded p-4">
          <p className="text-sm text-navy-500 mb-3">No batch is currently open.</p>
          {waitingCount > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2 mb-3 flex items-center gap-2">
              <HiOutlineClock className="w-4 h-4 shrink-0" />
              {waitingCount} order{waitingCount === 1 ? "" : "s"} waiting for the next batch — added automatically once you open one.
            </p>
          )}
          <form onSubmit={handleOpenBatch} className="space-y-3">
            <input
              required
              placeholder="Batch name (e.g. October Batch 1)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
            <div>
              <label className="block text-xs text-navy-500 mb-1">Target closing date (optional — shows a countdown to customers)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-1.5 bg-navy-800 text-white text-sm px-4 py-2 rounded hover:bg-navy-700 transition disabled:opacity-50"
            >
              <HiOutlinePlus className="w-4 h-4" /> Open new batch
            </button>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-navy-700 mb-3">Batch history</h3>
        <div className="bg-white border border-navy-100 rounded divide-y divide-navy-50">
          {batches.filter((b) => b.status === "closed").map((b) => (
            <div key={b.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <p className="text-navy-900">{b.name}</p>
                <p className="text-xs text-navy-400">
                  Closed {b.closed_at ? new Date(b.closed_at).toLocaleDateString("en-GB") : "—"}
                </p>
              </div>
              <span className="text-navy-400 text-xs">{b.orders?.[0]?.count ?? 0} orders</span>
            </div>
          ))}
          {batches.filter((b) => b.status === "closed").length === 0 && (
            <p className="text-center text-navy-400 text-sm py-6">No closed batches yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
