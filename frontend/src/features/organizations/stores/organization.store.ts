let activeOrganizationId: string | null = null;

export function setActiveOrganizationId(id: string | null) {
  activeOrganizationId = id;
}

export function getActiveOrganizationId() {
  return activeOrganizationId;
}
