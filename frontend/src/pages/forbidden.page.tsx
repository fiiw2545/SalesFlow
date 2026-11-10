import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";

function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-6 rounded-2xl bg-amber-50 p-5">
        <ShieldAlert size={40} className="text-amber-600" />
      </div>

      <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
        Error 403
      </p>

      <h1 className="mt-3 text-4xl font-bold text-slate-900">
        Access Forbidden
      </h1>

      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        You don't have permission to access this page. Please contact your
        administrator if you believe this is a mistake.
      </p>

      <Link
        to="/"
        className="mt-8 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

export default ForbiddenPage;
