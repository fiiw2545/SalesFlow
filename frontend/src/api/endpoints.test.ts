import { describe, expect, it } from "vitest";
import endpoints from "./endpoints";

describe("API Endpoints", () => {
  it("defines authentication endpoints", () => {
    expect(endpoints.auth).toEqual({
      register: "/auth/register",
      login: "/auth/login",
      logout: "/auth/logout",
      me: "/auth/me",
      meId: "/auth/me/id",
      refresh: "/auth/refresh",
      adminOnly: "/auth/admin-only",
      managerOnly: "/auth/manager-only",
      salesAccess: "/auth/sales-access",
    });
  });

  it("defines search endpoints", () => {
    expect(endpoints.search.global).toBe("/search/");
  });

  it("defines dashboard endpoints", () => {
    expect(endpoints.dashboard).toEqual({
      summary: "/dashboard/summary",
      dealsByStatus: "/dashboard/deals-by-status",
      dealsByStage: "/dashboard/deals-by-stage",
      dealsReport: "/dashboard/reports/deals",
      tasks: "/dashboard/tasks",
    });
  });

  it("defines CRUD endpoints correctly", () => {
    const resources = [
      endpoints.deals,
      endpoints.companies,
      endpoints.contacts,
      endpoints.activities,
      endpoints.tasks,
      endpoints.notes,
      endpoints.tags,
      endpoints.organizations,
      endpoints.memberships,
    ];

    for (const resource of resources) {
      expect(resource.list).toMatch(/\/$/);
      expect(resource.create).toBe(resource.list);
      expect(resource.detail("test-id")).toBe(resource.update("test-id"));
      expect(resource.detail("test-id")).toBe(resource.delete("test-id"));
    }
  });

  it("builds pipeline and stage endpoints", () => {
    expect(endpoints.pipelines.list).toBe("/pipelines/");
    expect(endpoints.pipelines.create).toBe("/pipelines/");
    expect(endpoints.pipelines.detail("pipeline-1")).toBe(
      "/pipelines/pipeline-1",
    );
    expect(endpoints.pipelines.update("pipeline-1")).toBe(
      "/pipelines/pipeline-1",
    );
    expect(endpoints.pipelines.delete("pipeline-1")).toBe(
      "/pipelines/pipeline-1",
    );

    expect(endpoints.pipelines.stages.list("pipeline-1")).toBe(
      "/pipelines/pipeline-1/stages/",
    );
    expect(endpoints.pipelines.stages.create("pipeline-1")).toBe(
      "/pipelines/pipeline-1/stages/",
    );
    expect(endpoints.pipelines.stages.detail("pipeline-1", "stage-1")).toBe(
      "/pipelines/pipeline-1/stages/stage-1",
    );
    expect(endpoints.pipelines.stages.update("pipeline-1", "stage-1")).toBe(
      "/pipelines/pipeline-1/stages/stage-1",
    );
    expect(endpoints.pipelines.stages.delete("pipeline-1", "stage-1")).toBe(
      "/pipelines/pipeline-1/stages/stage-1",
    );
  });

  it("builds tag relationship endpoints", () => {
    expect(endpoints.tags.companies.list("company-1")).toBe(
      "/tags/companies/company-1",
    );
    expect(endpoints.tags.companies.add("company-1")).toBe(
      "/tags/companies/company-1",
    );
    expect(endpoints.tags.companies.remove("company-1", "tag-1")).toBe(
      "/tags/companies/company-1/tag-1",
    );

    expect(endpoints.tags.contacts.list("contact-1")).toBe(
      "/tags/contacts/contact-1",
    );
    expect(endpoints.tags.contacts.add("contact-1")).toBe(
      "/tags/contacts/contact-1",
    );
    expect(endpoints.tags.contacts.remove("contact-1", "tag-1")).toBe(
      "/tags/contacts/contact-1/tag-1",
    );
  });

  it("builds invitation endpoints and encodes tokens", () => {
    expect(endpoints.invitations.list).toBe("/invitations/");
    expect(endpoints.invitations.create).toBe("/invitations/");
    expect(endpoints.invitations.accept).toBe("/invitations/accept");
    expect(endpoints.invitations.revoke("invite-1")).toBe(
      "/invitations/invite-1/revoke",
    );
    expect(endpoints.invitations.validate("abc 123")).toBe(
      "/invitations/validate/abc%20123",
    );
    expect(endpoints.invitations.validate("a/b+c")).toBe(
      "/invitations/validate/a%2Fb%2Bc",
    );
  });

  it("defines notification endpoints", () => {
    expect(endpoints.notifications.list).toBe("/notifications/");
    expect(endpoints.notifications.unreadCount).toBe(
      "/notifications/unread-count",
    );
    expect(endpoints.notifications.readAll).toBe("/notifications/read-all");
    expect(endpoints.notifications.read("notification-1")).toBe(
      "/notifications/notification-1/read",
    );
  });

  it("builds file and avatar endpoints", () => {
    expect(endpoints.files.upload).toBe("/files/upload");
    expect(endpoints.files.list).toBe("/files/");
    expect(endpoints.files.detail("file-1")).toBe("/files/file-1");
    expect(endpoints.files.download("file-1")).toBe("/files/file-1/download");
    expect(endpoints.files.delete("file-1")).toBe("/files/file-1");

    expect(endpoints.files.avatar.upload).toBe("/files/avatar/upload");
    expect(endpoints.files.avatar.download("user-1")).toBe(
      "/files/avatar/user-1/download",
    );
    expect(endpoints.files.avatar.delete).toBe("/files/avatar");
  });

  it("defines system endpoints", () => {
    expect(endpoints.system.dbVersion).toBe("/db-version");
    expect(endpoints.system.dbInfo).toBe("/db-info");
  });
});
