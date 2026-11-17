import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Company,
  CompanyListResponse,
  CompanyPayload,
  CompanyDeleteResponse,
  CompanyTagAssignment,
  CompanyTagAssignmentPayload,
  CompanyTagDeleteResponse,
} from "../types/company.types";

export async function getCompanies(
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<CompanyListResponse> {
  const response = await apiClient.get<CompanyListResponse>(
    endpoints.companies.list,
    {
      params: {
        page,
        limit,
        ...(search.trim() && { search: search.trim() }),
      },
    },
  );

  return response.data;
}

export async function getCompany(id: string): Promise<Company> {
  const response = await apiClient.get<Company>(endpoints.companies.detail(id));

  return response.data;
}

export async function createCompany(payload: CompanyPayload): Promise<Company> {
  const response = await apiClient.post<Company>(
    endpoints.companies.create,
    payload,
  );

  return response.data;
}

export async function updateCompany(
  id: string,
  payload: Partial<CompanyPayload>,
): Promise<Company> {
  const response = await apiClient.patch<Company>(
    endpoints.companies.update(id),
    payload,
  );

  return response.data;
}

export async function deleteCompany(
  id: string,
): Promise<CompanyDeleteResponse> {
  const response = await apiClient.delete<CompanyDeleteResponse>(
    endpoints.companies.delete(id),
  );

  return response.data;
}

export async function getCompanyTags(
  companyId: string,
): Promise<CompanyTagAssignment[]> {
  const response = await apiClient.get<CompanyTagAssignment[]>(
    endpoints.tags.companies.list(companyId),
  );

  return response.data;
}

export async function assignCompanyTag(
  companyId: string,
  payload: CompanyTagAssignmentPayload,
): Promise<CompanyTagAssignment> {
  const response = await apiClient.post<CompanyTagAssignment>(
    endpoints.tags.companies.add(companyId),
    payload,
  );

  return response.data;
}

export async function unassignCompanyTag(
  companyId: string,
  tagId: string,
): Promise<CompanyTagDeleteResponse> {
  const response = await apiClient.delete<CompanyTagDeleteResponse>(
    endpoints.tags.companies.remove(companyId, tagId),
  );

  return response.data;
}
