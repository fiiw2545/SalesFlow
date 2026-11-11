import { useQuery } from "@tanstack/react-query";

import { getDealsByStatus } from "../services/dashboard.service";
import { useOrganization } from "../../organizations/context/organization.context";
import type { DashboardDateRange } from "../types/dashboard.types";

export function useDealsByStatus(dateRange: DashboardDateRange) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: [
      "dashboard",
      "deals-by-status",
      activeOrganization?.id,
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: ({ signal }) => getDealsByStatus(dateRange, signal),
    enabled: isReady && !!activeOrganization,
  });
}
