import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useQuery } from "@tanstack/react-query";

import { getOrganizations } from "../services/organization.service";
import type { Organization } from "../types/organization.types";

import { setActiveOrganizationId as setStoredActiveOrganizationId } from "../stores/organization.store";

import { useAuth } from "../../auth/context/auth.context";

interface OrganizationContextType {
  organizations: Organization[];
  activeOrganization: Organization | null;
  setActiveOrganization: (organizationId: string) => void;
  isLoading: boolean;
  isError: boolean;
  isReady: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setActiveOrganizationState(null);
      setStoredActiveOrganizationId(null);
      setSyncedOrganizationId(null);
    }
  }, [isAuthLoading, isAuthenticated]);

  const [activeOrganizationId, setActiveOrganizationState] = useState<
    string | null
  >(null);

  const [syncedOrganizationId, setSyncedOrganizationId] = useState<
    string | null
  >(null);

  const {
    data,
    isLoading: isOrganizationLoading,
    isError,
  } = useQuery({
    queryKey: ["organizations", "all"],
    queryFn: () => getOrganizations(1, 100),
    enabled: !isAuthLoading && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const organizations = isAuthenticated ? (data?.items ?? []) : [];

  const activeOrganization =
    organizations.find(
      (organization) => organization.id === activeOrganizationId,
    ) ??
    organizations.find((organization) => organization.is_active) ??
    organizations[0] ??
    null;

  const currentOrganizationId = activeOrganization?.id ?? null;

  useEffect(() => {
    setStoredActiveOrganizationId(currentOrganizationId);
    setSyncedOrganizationId(currentOrganizationId);
  }, [currentOrganizationId]);

  const isReady =
    !isAuthLoading &&
    isAuthenticated &&
    !isOrganizationLoading &&
    !isError &&
    syncedOrganizationId === currentOrganizationId;

  const value: OrganizationContextType = {
    organizations,
    activeOrganization,
    setActiveOrganization: setActiveOrganizationState,
    isLoading: isAuthLoading || isOrganizationLoading,
    isError,
    isReady,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }

  return context;
}
