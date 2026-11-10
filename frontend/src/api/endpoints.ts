const endpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    meId: "/auth/me/id",
    refresh: "/auth/refresh",
    adminOnly: "/auth/admin-only",
    managerOnly: "/auth/manager-only",
    salesAccess: "/auth/sales-access",
  },

  search: {
    global: "/search/",
  },

  dashboard: {
    summary: "/dashboard/summary",
    dealsByStatus: "/dashboard/deals-by-status",
    dealsByStage: "/dashboard/deals-by-stage",
    dealsReport: "/dashboard/reports/deals",
    tasks: "/dashboard/tasks",
  },

  deals: {
    list: "/deals/",
    create: "/deals/",
    detail: (id: string) => `/deals/${id}`,
    update: (id: string) => `/deals/${id}`,
    delete: (id: string) => `/deals/${id}`,
  },

  companies: {
    list: "/companies/",
    create: "/companies/",
    detail: (id: string) => `/companies/${id}`,
    update: (id: string) => `/companies/${id}`,
    delete: (id: string) => `/companies/${id}`,
  },

  contacts: {
    list: "/contacts/",
    create: "/contacts/",
    detail: (id: string) => `/contacts/${id}`,
    update: (id: string) => `/contacts/${id}`,
    delete: (id: string) => `/contacts/${id}`,
  },

  pipelines: {
    list: "/pipelines/",
    create: "/pipelines/",
    detail: (id: string) => `/pipelines/${id}`,
    update: (id: string) => `/pipelines/${id}`,
    delete: (id: string) => `/pipelines/${id}`,

    stages: {
      list: (pipelineId: string) => `/pipelines/${pipelineId}/stages/`,
      create: (pipelineId: string) => `/pipelines/${pipelineId}/stages/`,
      detail: (pipelineId: string, stageId: string) =>
        `/pipelines/${pipelineId}/stages/${stageId}`,
      update: (pipelineId: string, stageId: string) =>
        `/pipelines/${pipelineId}/stages/${stageId}`,
      delete: (pipelineId: string, stageId: string) =>
        `/pipelines/${pipelineId}/stages/${stageId}`,
    },
  },

  activities: {
    list: "/activities/",
    create: "/activities/",
    detail: (id: string) => `/activities/${id}`,
    update: (id: string) => `/activities/${id}`,
    delete: (id: string) => `/activities/${id}`,
  },

  tasks: {
    list: "/tasks/",
    create: "/tasks/",
    detail: (id: string) => `/tasks/${id}`,
    update: (id: string) => `/tasks/${id}`,
    delete: (id: string) => `/tasks/${id}`,
  },

  notes: {
    list: "/notes/",
    create: "/notes/",
    detail: (id: string) => `/notes/${id}`,
    update: (id: string) => `/notes/${id}`,
    delete: (id: string) => `/notes/${id}`,
  },

  tags: {
    list: "/tags/",
    create: "/tags/",
    detail: (id: string) => `/tags/${id}`,
    update: (id: string) => `/tags/${id}`,
    delete: (id: string) => `/tags/${id}`,

    companies: {
      list: (companyId: string) => `/tags/companies/${companyId}`,
      add: (companyId: string) => `/tags/companies/${companyId}`,
      remove: (companyId: string, tagId: string) =>
        `/tags/companies/${companyId}/${tagId}`,
    },

    contacts: {
      list: (contactId: string) => `/tags/contacts/${contactId}`,
      add: (contactId: string) => `/tags/contacts/${contactId}`,
      remove: (contactId: string, tagId: string) =>
        `/tags/contacts/${contactId}/${tagId}`,
    },
  },

  organizations: {
    list: "/organizations/",
    create: "/organizations/",
    detail: (id: string) => `/organizations/${id}`,
    update: (id: string) => `/organizations/${id}`,
    delete: (id: string) => `/organizations/${id}`,
  },

  memberships: {
    list: "/memberships/",
    create: "/memberships/",
    detail: (id: string) => `/memberships/${id}`,
    update: (id: string) => `/memberships/${id}`,
    delete: (id: string) => `/memberships/${id}`,
  },

  notifications: {
    list: "/notifications/",
    unreadCount: "/notifications/unread-count",
    readAll: "/notifications/read-all",
    read: (id: string) => `/notifications/${id}/read`,
  },

  system: {
    dbVersion: "/db-version",
    dbInfo: "/db-info",
  },
} as const;

export default endpoints;
