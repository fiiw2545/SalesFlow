import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";

import queryClient from "./api/query-client";
import router from "./routes";

import { AuthProvider } from "./features/auth/context/auth.context";
import { OrganizationProvider } from "./features/organizations/context/organization.context";

import { ToastProvider } from "./components/common/toast-provider";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
