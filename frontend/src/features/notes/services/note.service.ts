import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Note,
  NotePayload,
  NoteListResponse,
  NoteDeleteResponse,
} from "../types/note.types";

function toRecordId(
  table: "companies" | "contacts" | "deals",
  id: string | null,
): string | null {
  if (!id) return null;

  if (id.startsWith(`${table}:`)) return id;

  return `${table}:${id}`;
}

function normalizePayload(payload: NotePayload): NotePayload {
  return {
    ...payload,
    company_id: toRecordId("companies", payload.company_id),
    contact_id: toRecordId("contacts", payload.contact_id),
    deal_id: toRecordId("deals", payload.deal_id),
  };
}

export async function getNotes(
  page = 1,
  limit = 10,
): Promise<NoteListResponse> {
  const response = await apiClient.get<NoteListResponse>(endpoints.notes.list, {
    params: { page, limit },
  });

  return response.data;
}

export async function getNote(id: string): Promise<Note> {
  const response = await apiClient.get<Note>(endpoints.notes.detail(id));
  return response.data;
}

export async function createNote(payload: NotePayload): Promise<Note> {
  const response = await apiClient.post<Note>(
    endpoints.notes.create,
    normalizePayload(payload),
  );

  return response.data;
}

export async function updateNote(
  id: string,
  payload: NotePayload,
): Promise<Note> {
  const response = await apiClient.put<Note>(
    endpoints.notes.update(id),
    normalizePayload(payload),
  );

  return response.data;
}

export async function deleteNote(id: string): Promise<NoteDeleteResponse> {
  const response = await apiClient.delete<NoteDeleteResponse>(
    endpoints.notes.delete(id),
  );

  return response.data;
}
