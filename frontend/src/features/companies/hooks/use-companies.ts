import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../services/company.service";

import type { CompanyPayload } from "../types/company.types";

export function useCompanies(
  page: number = 1,
  limit: number = 10,
  search: string = "",
) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["companies", activeOrganization?.id, page, limit, search],
    queryFn: () => getCompanies(page, limit, search),
    enabled: isReady && !!activeOrganization,
  });
}
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompanyPayload) => createCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companies"],
      });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CompanyPayload>;
    }) => updateCompany(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companies"],
      });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companies"],
      });
    },
  });
}
