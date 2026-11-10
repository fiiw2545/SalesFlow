import { useQuery } from "@tanstack/react-query";

import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import { getActiveOrganizationId } from "../../organizations/stores/organization.store";

import type { SearchResponse } from "../types/search.types";

async function fetchGlobalSearch(query: string) {
  const response = await apiClient.get<SearchResponse>(
    endpoints.search.global,
    {
      params: {
        q: query,
      },
    },
  );

  return response.data;
}

export function useGlobalSearch(query: string, enabled: boolean) {
  const organizationId = getActiveOrganizationId();

  return useQuery({
    queryKey: ["global-search", organizationId, query],
    queryFn: () => fetchGlobalSearch(query),
    enabled: enabled && query.trim().length >= 2 && !!organizationId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}
