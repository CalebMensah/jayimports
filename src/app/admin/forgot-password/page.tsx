"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HiOutlineMail, HiOutlineCheck } from "react-icons/hi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password`,
    });

    setLoading(false);

    // Always show success, even on error — don't reveal whether an email is a registered admin
    if (resetError) {
      console.error(resetError);
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg p-6 md:p-8">
        <h1 className="text-xl font-display font-semibold text-navy-900 mb-1">Reset password</h1>
        <p className="text-sm text-navy-500 mb-6">
          Enter your admin email and we&apos;ll send a reset link.
        </p>

        {sent ? (
          <div className="text-center py-4">
            <HiOutlineCheck className="w-8 h-8 text-turquoise-dark mx-auto mb-2" />
            <p className="text-sm text-navy-700">
              If that email is registered, a reset link is on its way. Check your inbox.
            </p>
            <Link href="/admin/login" className="text-sm text-ocean hover:underline mt-4 inline-block">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}
            <div className="relative">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full border border-navy-100 rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-800 text-white rounded py-2 text-sm font-medium hover:bg-navy-700 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <Link href="/admin/login" className="block text-center text-sm text-navy-400 hover:text-navy-600">
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}