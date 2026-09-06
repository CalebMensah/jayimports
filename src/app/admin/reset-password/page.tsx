"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HiOutlineLockClosed } from "react-icons/hi";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Could not reset password. The link may have expired — request a new one.");
      return;
    }

    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg p-6 md:p-8">
        <h1 className="text-xl font-display font-semibold text-navy-900 mb-1">Set new password</h1>
        <p className="text-sm text-navy-500 mb-6">Choose a new password for your admin account.</p>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
            <input
              type="password"
              required
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-navy-100 rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
          </div>
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-navy-100 rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-800 text-white rounded py-2 text-sm font-medium hover:bg-navy-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}