import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getCompanyTags,
  assignCompanyTag,
  unassignCompanyTag,
} from "../services/company.service";

import type { CompanyTagAssignmentPayload } from "../types/company.types";

export function useCompanyTags(companyId: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["company-tags", activeOrganization?.id, companyId],
    queryFn: () => getCompanyTags(companyId),
    enabled: isReady && !!activeOrganization && !!companyId,
  });
}

export function useAssignCompanyTag() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganization();

  return useMutation({
    mutationFn: ({
      companyId,
      payload,
    }: {
      companyId: string;
      payload: CompanyTagAssignmentPayload;
    }) => assignCompanyTag(companyId, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["company-tags", activeOrganization?.id, variables.companyId],
      });
    },
  });
}

export function useUnassignCompanyTag() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganization();

  return useMutation({
    mutationFn: ({ companyId, tagId }: { companyId: string; tagId: string }) =>
      unassignCompanyTag(companyId, tagId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["company-tags", activeOrganization?.id, variables.companyId],
      });
    },
  });
}
