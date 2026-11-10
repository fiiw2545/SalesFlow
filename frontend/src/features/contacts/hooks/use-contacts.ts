import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../services/contact.service";

import type { ContactPayload } from "../types/contact.types";

export function useContacts(page = 1, limit = 10, search = "") {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["contacts", activeOrganization?.id, page, limit, search],
    queryFn: () => getContacts(page, limit, search),
    enabled: isReady && !!activeOrganization,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContactPayload) => createContact(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contacts"],
      });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ContactPayload }) =>
      updateContact(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contacts"],
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contacts"],
      });
    },
  });
}
