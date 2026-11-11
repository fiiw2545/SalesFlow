import { useQuery } from "@tanstack/react-query";

import { getActivities } from "../../activities/services/activity.service";
import { useOrganization } from "../../organizations/context/organization.context";

export function useRecentActivities() {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["dashboard", "recent-activities", activeOrganization?.id],

    queryFn: ({ signal }) => getActivities(1, 10, signal),

    enabled: isReady && !!activeOrganization,

    select: (response) => {
      return response.items.slice(0, 5);
    },
  });
}
