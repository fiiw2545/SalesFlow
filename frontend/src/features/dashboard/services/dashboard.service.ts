import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  DashboardSummary,
  DealsByStatusResponse,
  DealsByStageResponse,
  DashboardDateRange,
  DealsReportResponse,
} from "../types/dashboard.types";

export async function getDashboardSummary(
  dateRange: DashboardDateRange,
): Promise<DashboardSummary> {
  const response = await apiClient.get<DashboardSummary>(
    endpoints.dashboard.summary,
    {
      params: {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      },
    },
  );

  return response.data;
}

export async function getDealsByStatus(
  dateRange: DashboardDateRange,
): Promise<DealsByStatusResponse> {
  const response = await apiClient.get<DealsByStatusResponse>(
    endpoints.dashboard.dealsByStatus,
    {
      params: {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      },
    },
  );

  return response.data;
}

export async function getDealsByStage(
  dateRange: DashboardDateRange,
): Promise<DealsByStageResponse> {
  const response = await apiClient.get<DealsByStageResponse>(
    endpoints.dashboard.dealsByStage,
    {
      params: {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      },
    },
  );

  return response.data;
}

export const getDealsReport = async (
  dateRange: DashboardDateRange = {},
): Promise<DealsReportResponse> => {
  const response = await apiClient.get<DealsReportResponse>(
    endpoints.dashboard.dealsReport,
    {
      params: {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      },
    },
  );

  return response.data;
};
