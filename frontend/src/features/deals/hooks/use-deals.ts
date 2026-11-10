import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
} from "../services/deal.service";

import type { DealCreatePayload, DealUpdatePayload } from "../types/deal.types";

export function useDeals(page = 1, limit = 10, search = "") {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["deals", activeOrganization?.id, page, limit, search],
    queryFn: () => getDeals(page, limit, search),
    enabled: isReady && !!activeOrganization,
  });
}

export function useDeal(id: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["deals", activeOrganization?.id, id],
    queryFn: () => getDeal(id),
    enabled: isReady && !!activeOrganization && !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DealCreatePayload) => createDeal(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deals"],
      });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DealUpdatePayload }) =>
      updateDeal(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deals"],
      });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDeal(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deals"],
      });
    },
  });
}
