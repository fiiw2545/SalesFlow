import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getContactTags,
  assignContactTag,
  unassignContactTag,
} from "../services/contact.service";

import type { ContactTagAssignmentPayload } from "../types/contact.types";

export function useContactTags(contactId: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["contact-tags", activeOrganization?.id, contactId],
    queryFn: () => getContactTags(contactId),
    enabled: isReady && !!activeOrganization && !!contactId,
  });
}

export function useAssignContactTag() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganization();

  return useMutation({
    mutationFn: ({
      contactId,
      payload,
    }: {
      contactId: string;
      payload: ContactTagAssignmentPayload;
    }) => assignContactTag(contactId, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contact-tags", activeOrganization?.id, variables.contactId],
      });
    },
  });
}

export function useUnassignContactTag() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganization();

  return useMutation({
    mutationFn: ({ contactId, tagId }: { contactId: string; tagId: string }) =>
      unassignContactTag(contactId, tagId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contact-tags", activeOrganization?.id, variables.contactId],
      });
    },
  });
}
