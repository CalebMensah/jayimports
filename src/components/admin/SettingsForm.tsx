"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineCheck } from "react-icons/hi";

type Settings = {
  business_name: string;
  momo_number: string;
  momo_network: string;
  contact_phone: string;
  contact_email: string;
  pickup_address: string;
  delivery_fee_default: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Could not save settings");
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}

      <div>
        <h3 className="text-sm font-medium text-navy-700 mb-3">Business info</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-navy-500 mb-1">Business name</label>
            <input
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
              className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
          </div>
          <div>
            <label className="block text-xs text-navy-500 mb-1">Pickup address</label>
            <textarea
              rows={2}
              value={form.pickup_address}
              onChange={(e) => update("pickup_address", e.target.value)}
              className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-navy-700 mb-3">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-navy-500 mb-1">Contact phone</label>
            <input
              value={form.contact_phone}
              onChange={(e) => update("contact_phone", e.target.value)}
              className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
          </div>
          <div>
            <label className="block text-xs text-navy-500 mb-1">Contact email</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-navy-700 mb-3">Payments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-navy-500 mb-1">MoMo number</label>
            <input
              value={form.momo_number}
              onChange={(e) => update("momo_number", e.target.value)}
              className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
          </div>
          <div>
            <label className="block text-xs text-navy-500 mb-1">MoMo network</label>
            <select
              value={form.momo_network}
              onChange={(e) => update("momo_network", e.target.value)}
              className="w-full border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            >
              <option value="MTN">MTN</option>
              <option value="Vodafone">Vodafone</option>
              <option value="AirtelTigo">AirtelTigo</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-navy-400 mt-2">
          Paystack API keys are set as environment variables, not here, for security.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-navy-700 mb-3">Delivery</h3>
        <div>
          <label className="block text-xs text-navy-500 mb-1">Default delivery fee (GH₵)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.delivery_fee_default}
            onChange={(e) => update("delivery_fee_default", Number(e.target.value))}
            className="w-full sm:w-48 border border-navy-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-navy-800 text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-navy-700 transition disabled:opacity-50"
      >
        {saved && <HiOutlineCheck className="w-4 h-4" />}
        {saving ? "Saving..." : saved ? "Saved" : "Save settings"}
      </button>
    </form>
  );
}