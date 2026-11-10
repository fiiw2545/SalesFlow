import { useQuery } from "@tanstack/react-query";

import { getDealsByStage } from "../services/dashboard.service";
import { useOrganization } from "../../organizations/context/organization.context";
import type { DashboardDateRange } from "../types/dashboard.types";

export function useDealsByStage(dateRange: DashboardDateRange) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: [
      "dashboard",
      "deals-by-stage",
      activeOrganization?.id,
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () => getDealsByStage(dateRange),
    enabled: isReady && !!activeOrganization,
  });
}
