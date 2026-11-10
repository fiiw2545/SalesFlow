import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Contact,
  ContactPayload,
  ContactListResponse,
} from "../types/contact.types";

type SurrealRecordId = {
  table_name: string;
  id: string;
};

type ContactApiData = {
  id: SurrealRecordId;
  name: string;
  email: string;
  phone: string;
  age: number;
  company_id: SurrealRecordId | null;
  position: string | null;
  created_at: string;
};

type ContactListApiResponse = {
  message: string;
  data: ContactApiData[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

type ContactApiResponse = {
  message: string;
  data: ContactApiData | ContactApiData[];
};

function normalizeContact(contact: ContactApiData): Contact {
  return {
    id: contact.id.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    age: contact.age,
    company_id: contact.company_id?.id ?? null,
    position: contact.position,
    created_at: contact.created_at,
  };
}

function normalizeResponse(data: ContactApiData | ContactApiData[]): Contact {
  const contact = Array.isArray(data) ? data[0] : data;

  if (!contact) {
    throw new Error("Contact response is empty.");
  }

  return normalizeContact(contact);
}

function normalizePayload(payload: ContactPayload) {
  return {
    ...payload,
    company_id: payload.company_id
      ? `companies:${payload.company_id.replace(/^companies:/, "")}`
      : null,
  };
}

export async function getContacts(
  page = 1,
  limit = 10,
  search = "",
): Promise<ContactListResponse> {
  const response = await apiClient.get<ContactListApiResponse>(
    endpoints.contacts.list,
    {
      params: {
        page,
        limit,
        ...(search.trim() ? { search: search.trim() } : {}),
      },
    },
  );

  return {
    data: response.data.data.map(normalizeContact),
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    total_pages: response.data.total_pages,
  };
}

export async function createContact(payload: ContactPayload): Promise<Contact> {
  const response = await apiClient.post<ContactApiResponse>(
    endpoints.contacts.create,
    normalizePayload(payload),
  );

  return normalizeResponse(response.data.data);
}

export async function updateContact(
  id: string,
  payload: ContactPayload,
): Promise<Contact> {
  const response = await apiClient.put<ContactApiResponse>(
    endpoints.contacts.update(id),
    normalizePayload(payload),
  );

  return normalizeResponse(response.data.data);
}

export async function deleteContact(id: string): Promise<void> {
  await apiClient.delete(endpoints.contacts.delete(id));
}
