import { Link } from "react-router";
import { SearchX } from "lucide-react";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-6 rounded-2xl bg-blue-50 p-5">
        <SearchX size={40} className="text-blue-600" />
      </div>

      <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
        Error 404
      </p>

      <h1 className="mt-3 text-4xl font-bold text-slate-900">Page not found</h1>

      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        Sorry, the page you are looking for doesn't exist or may have been
        moved.
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

export default NotFoundPage;
