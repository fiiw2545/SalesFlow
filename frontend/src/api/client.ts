import axios from "axios";

import { getActiveOrganizationId } from "../features/organizations/stores/organization.store";

const apiClient = axios.create({
  baseURL: window.SALESFLOW_CONFIG.API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const organizationId = getActiveOrganizationId();

  if (organizationId) {
    config.headers.set("X-Organization-ID", organizationId);
  }

  return config;
});

export default apiClient;
