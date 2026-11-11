import { useQuery } from "@tanstack/react-query";

import { getTasks } from "../../tasks/services/task.service";
import { useOrganization } from "../../organizations/context/organization.context";

export function usePendingTasks() {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["dashboard", "pending-tasks", activeOrganization?.id],

    queryFn: ({ signal }) => getTasks(1, 10, signal),

    enabled: isReady && !!activeOrganization,

    select: (response) => {
      return response.items
        .filter(
          (task) => task.status === "PENDING" || task.status === "IN_PROGRESS",
        )
        .sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;

          return (
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
        })
        .slice(0, 5);
    },
  });
}
