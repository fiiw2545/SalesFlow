import { useQuery } from "@tanstack/react-query";

import { getDashboardSummary } from "../services/dashboard.service";
import { useOrganization } from "../../organizations/context/organization.context";
import type { DashboardDateRange } from "../types/dashboard.types";

export function useDashboardSummary(dateRange: DashboardDateRange) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: [
      "dashboard",
      "summary",
      activeOrganization?.id,
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: ({ signal }) => getDashboardSummary(dateRange, signal),
    enabled: isReady && !!activeOrganization,
  });
}
