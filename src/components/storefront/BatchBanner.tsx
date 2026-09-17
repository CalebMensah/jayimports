import { HiOutlineClock, HiOutlineSparkles } from "react-icons/hi";
import { daysUntil, type CurrentBatch } from "@/lib/batches";

export function BatchBanner({ batch }: { batch: CurrentBatch }) {
  if (!batch) {
    return (
      <div className="bg-navy-50 border border-navy-100 rounded px-4 py-3 mb-6 flex items-center gap-2 text-sm text-navy-600">
        <HiOutlineClock className="w-4 h-4 text-navy-400 shrink-0" />
        We&apos;re between preorder batches right now — orders placed today will join our next batch.
      </div>
    );
  }

  const daysLeft = daysUntil(batch.target_closes_at);
  const isUrgent = daysLeft !== null && daysLeft <= 10 && daysLeft >= 0;
  const isPast = daysLeft !== null && daysLeft < 0;

  return (
    <div
      className={`rounded px-4 py-3 mb-6 flex items-center justify-between gap-3 text-sm ${
        isUrgent ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-turquoise/10 border border-turquoise/20 text-navy-700"
      }`}
    >
      <div className="flex items-center gap-2">
        <HiOutlineSparkles className={`w-4 h-4 shrink-0 ${isUrgent ? "text-amber-600" : "text-turquoise-dark"}`} />
        <span><strong>{batch.name}</strong> is open for orders</span>
      </div>
      {daysLeft !== null && !isPast && (
        <span className={`text-xs font-medium whitespace-nowrap ${isUrgent ? "text-amber-700" : "text-navy-500"}`}>
          {daysLeft === 0 ? "Closes today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
        </span>
      )}
    </div>
  );
    }
