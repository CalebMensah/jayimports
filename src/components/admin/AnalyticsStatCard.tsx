import { HiOutlineArrowUp, HiOutlineArrowDown } from "react-icons/hi";
import type { IconType } from "react-icons";

export function AnalyticsStatCard({
  label,
  value,
  icon: Icon,
  changePercent,
}: {
  label: string;
  value: string;
  icon: IconType;
  changePercent?: number;
}) {
  const showChange = typeof changePercent === "number" && Number.isFinite(changePercent);
  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <div className="bg-white border border-navy-100 rounded p-4 md:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl md:text-3xl font-display text-navy-900">{value}</p>
          <p className="text-sm text-navy-400 mt-1">{label}</p>
        </div>
        <Icon className="w-5 h-5 text-turquoise-dark shrink-0" />
      </div>
      {showChange && (
        <p className={`text-xs mt-2 flex items-center gap-1 ${isPositive ? "text-turquoise-dark" : "text-red-500"}`}>
          {isPositive ? <HiOutlineArrowUp className="w-3 h-3" /> : <HiOutlineArrowDown className="w-3 h-3" />}
          {Math.abs(changePercent!).toFixed(1)}% vs last month
        </p>
      )}
    </div>
  );
}