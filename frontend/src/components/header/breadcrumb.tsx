import { useLocation } from "react-router";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/companies": "Companies",
  "/contacts": "Contacts",
  "/deals": "Deals",
  "/tasks": "Tasks",
  "/activities": "Activities",
  "/notes": "Notes",
  "/pipelines": "Pipelines",
  "/tags": "Tags",
  "/organization": "Organization",
  "/members": "Members",
};

function Breadcrumb() {
  const { pathname } = useLocation();
  const pageName = pageNames[pathname] ?? "Page";

  return (
    <div className="min-w-0">
      <p className="hidden text-xs text-slate-400 sm:block">Workspace</p>

      <h1
        className="truncate text-base font-semibold text-slate-800 sm:text-lg"
        title={pageName}
      >
        {pageName}
      </h1>
    </div>
  );
}

export default Breadcrumb;
