import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBackground?: string;
};

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBackground = "bg-blue-50",
}: KpiCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-3 break-words text-xl font-semibold text-slate-900 sm:text-2xl">
            {value}
          </h3>
        </div>

        <div className={`shrink-0 rounded-lg p-2.5 sm:p-3 ${iconBackground}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>

      <p className="mt-4 break-words text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default KpiCard;
