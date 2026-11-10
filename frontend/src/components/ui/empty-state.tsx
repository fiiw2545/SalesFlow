import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

function EmptyState({
  title = "No data found",
  description = "There is no information to display yet.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="
        flex flex-col items-center justify-center
        rounded-xl border border-dashed border-slate-300
        bg-white px-6 py-12 text-center
      "
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon ?? <Inbox size={28} />}
      </div>

      <h3 className="text-base font-semibold leading-6 text-slate-800">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-sm font-normal leading-5 text-slate-500">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
