import { createBrowserRouter } from "react-router";

import App from "../App";
import MainLayout from "../layouts/main-layout";

import LoginPage from "../features/auth/pages/login.page";
import RegisterPage from "../features/auth/pages/register.page";
import MyAccountPage from "../features/auth/pages/my-account.page";
import ProtectedRoute from "../features/auth/routes/protected-route";
import NotFoundPage from "../pages/not-found.page";
import ForbiddenPage from "../pages/forbidden.page";
import CompaniesPage from "../features/companies/pages/companies.page";
import ContactsPage from "../features/contacts/pages/contacts.page";
import PipelinesPage from "../features/pipelines/pages/pipelines.page";
import StagesPage from "../features/pipelines/pages/stages.page";
import DealPage from "../features/deals/pages/deals.page";
import ActivatePage from "../features/activities/pages/activities.page";
import TasksPage from "../features/tasks/pages/tasks.page";
import NotePage from "../features/notes/pages/notes.page";
import TagsPage from "../features/tags/pages/tags.page";
import OrganizationPage from "../features/organizations/pages/organization-page";
import MembersPage from "../features/memberships/pages/members-page";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/",
            element: <App />,
          },
          {
            path: "/my-account",
            element: <MyAccountPage />,
          },
          {
            path: "/companies",
            element: <CompaniesPage />,
          },
          {
            path: "/contacts",
            element: <ContactsPage />,
          },
          {
            path: "/deals",
            element: <DealPage />,
          },
          {
            path: "/tasks",
            element: <TasksPage />,
          },
          {
            path: "/activities",
            element: <ActivatePage />,
          },
          {
            path: "/notes",
            element: <NotePage />,
          },
          {
            path: "/pipelines",
            element: <PipelinesPage />,
          },
          {
            path: "/pipelines/:pipelineId/stages",
            element: <StagesPage />,
          },
          {
            path: "/tags",
            element: <TagsPage />,
          },
          {
            path: "/organization",
            element: <OrganizationPage />,
          },
          {
            path: "/members",
            element: <MembersPage />,
          },
        ],
      },
      {
        path: "/forbidden",
        element: <ForbiddenPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
