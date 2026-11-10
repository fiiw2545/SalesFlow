import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from "../services/note.service";

import type { NotePayload } from "../types/note.types";

export function useNotes(page = 1, limit = 10) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["notes", activeOrganization?.id, page, limit],
    queryFn: () => getNotes(page, limit),
    enabled: isReady && !!activeOrganization,
  });
}

export function useNote(id: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["notes", activeOrganization?.id, id],
    queryFn: () => getNote(id),
    enabled: isReady && !!activeOrganization && !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NotePayload) => createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NotePayload }) =>
      updateNote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
