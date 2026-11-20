import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";

import MainLayout from "../layouts/main-layout";
import ProtectedRoute from "../features/auth/routes/protected-route";

const App = lazy(() => import("../App"));

const LoginPage = lazy(() => import("../features/auth/pages/login.page"));
const RegisterPage = lazy(() => import("../features/auth/pages/register.page"));
const MyAccountPage = lazy(
  () => import("../features/auth/pages/my-account.page"),
);

const NotFoundPage = lazy(() => import("../pages/not-found.page"));
const ForbiddenPage = lazy(() => import("../pages/forbidden.page"));

const CompaniesPage = lazy(
  () => import("../features/companies/pages/companies.page"),
);
const ContactsPage = lazy(
  () => import("../features/contacts/pages/contacts.page"),
);
const PipelinesPage = lazy(
  () => import("../features/pipelines/pages/pipelines.page"),
);
const StagesPage = lazy(
  () => import("../features/pipelines/pages/stages.page"),
);
const DealPage = lazy(() => import("../features/deals/pages/deals.page"));
const ActivatePage = lazy(
  () => import("../features/activities/pages/activities.page"),
);
const TasksPage = lazy(() => import("../features/tasks/pages/tasks.page"));
const NotePage = lazy(() => import("../features/notes/pages/notes.page"));
const TagsPage = lazy(() => import("../features/tags/pages/tags.page"));
const OrganizationPage = lazy(
  () => import("../features/organizations/pages/organization-page"),
);
const MembersPage = lazy(
  () => import("../features/memberships/pages/members-page"),
);
const AcceptInvitationPage = lazy(
  () => import("../features/invitations/pages/accept-invitation.page"),
);
const FilesPage = lazy(() => import("../features/files/pages/files.page"));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">กำลังโหลดหน้า...</p>
      </div>
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/register",
    element: withSuspense(<RegisterPage />),
  },
  {
    path: "/accept-invitation",
    element: withSuspense(<AcceptInvitationPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/",
            element: withSuspense(<App />),
          },
          {
            path: "/my-account",
            element: withSuspense(<MyAccountPage />),
          },
          {
            path: "/companies",
            element: withSuspense(<CompaniesPage />),
          },
          {
            path: "/contacts",
            element: withSuspense(<ContactsPage />),
          },
          {
            path: "/deals",
            element: withSuspense(<DealPage />),
          },
          {
            path: "/tasks",
            element: withSuspense(<TasksPage />),
          },
          {
            path: "/activities",
            element: withSuspense(<ActivatePage />),
          },
          {
            path: "/notes",
            element: withSuspense(<NotePage />),
          },
          {
            path: "/pipelines",
            element: withSuspense(<PipelinesPage />),
          },
          {
            path: "/pipelines/:pipelineId/stages",
            element: withSuspense(<StagesPage />),
          },
          {
            path: "/tags",
            element: withSuspense(<TagsPage />),
          },
          {
            path: "/organization",
            element: withSuspense(<OrganizationPage />),
          },
          {
            path: "/members",
            element: withSuspense(<MembersPage />),
          },
          {
            path: "/files",
            element: withSuspense(<FilesPage />),
          },
        ],
      },
      {
        path: "/forbidden",
        element: withSuspense(<ForbiddenPage />),
      },
    ],
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />),
  },
]);

export default router;
