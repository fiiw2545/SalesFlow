import { Construction } from "lucide-react";

type ComingSoonProps = {
  title: string;
  description?: string;
};

function ComingSoon({
  title,
  description = "This feature is currently under development.",
}: ComingSoonProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="mb-4 rounded-2xl bg-blue-50 p-4">
        <Construction size={28} className="text-blue-600" />
      </div>

      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>

      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default ComingSoon;
