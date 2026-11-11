"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const FAST_MS = 4000;
const SLOW_MS = 10000;
const FAST_FOR_MS = 60_000;
const GIVE_UP_MS = 10 * 60_000;

export function PaymentStatusWatcher({
  orderNumber,
  reference,
}: {
  orderNumber: string;
  reference?: string;
}) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const done = useRef(false);

  const check = useCallback(async () => {
    if (busy.current || done.current) return;
    busy.current = true;
    try {
      const params = new URLSearchParams({ orderNumber });
      if (reference) params.set("reference", reference);

      const res = await fetch(`/api/orders/payment-status?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data: { state?: string } = await res.json();
        if (data.state === "paid" && !done.current) {
          done.current = true;
          // Re-renders the page on the server, which now shows the paid state and the group link
          router.refresh();
        }
      }
    } catch {
      // Network blip: the next check tries again
    } finally {
      busy.current = false;
    }
  }, [orderNumber, reference, router]);

  useEffect(() => {
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const tick = async () => {
      if (stopped || done.current) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed > GIVE_UP_MS) {
        setTimedOut(true);
        return;
      }
      await check();
      if (stopped || done.current) return;
      timer = setTimeout(tick, elapsed < FAST_FOR_MS ? FAST_MS : SLOW_MS);
    };

    timer = setTimeout(tick, 1500);

    // Coming back from the banking or MoMo app: check straight away
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check, attempt]);

  if (timedOut) {
    return (
      <div className="text-sm text-navy-600 bg-amber-50 rounded p-4 mb-6" aria-live="polite">
        <p className="font-medium text-amber-800">We haven&apos;t received confirmation yet.</p>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          If you&apos;ve paid, it can take a few more minutes. Contact us with your order number and we&apos;ll
          check it for you.
        </p>
        <button
          type="button"
          onClick={() => {
            setTimedOut(false);
            setAttempt((a) => a + 1);
          }}
          className="mt-3 text-sm border border-amber-300 bg-white text-amber-800 rounded px-4 py-1.5 hover:bg-amber-100 transition"
        >
          Check again
        </button>
      </div>
    );
  }

  return (
    <div className="text-sm bg-amber-50 rounded p-4 mb-6" aria-live="polite">
      <p className="flex items-center justify-center gap-2 font-medium text-amber-800">
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        Confirming your payment…
      </p>
      <p className="text-xs text-amber-700 mt-1">
        This usually takes under a minute. Stay on this page, it updates by itself.
      </p>
    </div>
  );
}
