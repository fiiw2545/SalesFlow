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

import {
  getActiveOrganizationId,
  setActiveOrganizationId as setStoredActiveOrganizationId,
} from "../stores/organization.store";

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

interface SelectedOrganization {
  userId: string;
  organizationId: string;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [selectedOrganization, setSelectedOrganization] =
    useState<SelectedOrganization | null>(null);

  const [syncedOrganizationKey, setSyncedOrganizationKey] = useState<
    string | null
  >(null);

  const {
    data,
    isLoading: isQueryLoading,
    isError,
  } = useQuery({
    queryKey: ["organizations", "all", user?.id],
    queryFn: () => getOrganizations(1, 100),
    enabled: !isAuthLoading && isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isOrganizationLoading = isAuthenticated && !!user?.id && isQueryLoading;

  const organizations = isAuthenticated ? (data?.items ?? []) : [];

  // Only use the selected organization belonging to the current user.
  const selectedOrganizationId =
    selectedOrganization && selectedOrganization.userId === user?.id
      ? selectedOrganization.organizationId
      : null;

  const activeOrganization =
    organizations.find(
      (organization) => organization.id === selectedOrganizationId,
    ) ??
    organizations.find((organization) => organization.is_active) ??
    organizations[0] ??
    null;

  const currentOrganizationId = activeOrganization?.id ?? null;

  const currentOrganizationKey =
    user?.id && currentOrganizationId
      ? `${user.id}:${currentOrganizationId}`
      : null;

  // Synchronize the external store only after the current user's
  // organization query has completed successfully.
  useEffect(() => {
    if (
      isAuthLoading ||
      !isAuthenticated ||
      !user?.id ||
      isOrganizationLoading ||
      isError ||
      data === undefined ||
      !currentOrganizationId ||
      !currentOrganizationKey
    ) {
      setStoredActiveOrganizationId(null);
      setSyncedOrganizationKey(null);
      return;
    }

    setStoredActiveOrganizationId(currentOrganizationId);
    setSyncedOrganizationKey(currentOrganizationKey);
  }, [
    isAuthLoading,
    isAuthenticated,
    user?.id,
    isOrganizationLoading,
    isError,
    data,
    currentOrganizationId,
    currentOrganizationKey,
  ]);

  const isReady =
    !isAuthLoading &&
    isAuthenticated &&
    !!user?.id &&
    !isOrganizationLoading &&
    !isError &&
    data !== undefined &&
    !!currentOrganizationId &&
    syncedOrganizationKey === currentOrganizationKey &&
    getActiveOrganizationId() === currentOrganizationId;

  const handleSetActiveOrganization = (organizationId: string) => {
    if (!user?.id) return;

    const organizationExists = organizations.some(
      (organization) => organization.id === organizationId,
    );

    if (!organizationExists) return;

    setSelectedOrganization({
      userId: user.id,
      organizationId,
    });
  };

  const value: OrganizationContextType = {
    organizations,
    activeOrganization,
    setActiveOrganization: handleSetActiveOrganization,
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
