export function getStoredTenantUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("tenantUser");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.warn("Invalid tenant session found in localStorage. Clearing it.", error);
    window.localStorage.removeItem("tenantUser");
    return null;
  }
}

export function getTenantId() {
  const user = getStoredTenantUser();
  if (!user) return null;

  const tenantId = user.id ?? user.tenant_id;
  if (tenantId === undefined || tenantId === null || tenantId === "") {
    return null;
  }

  const parsed = Number(tenantId);
  return Number.isFinite(parsed) ? parsed : null;
}

export function saveTenantUser(user) {
  if (!user || typeof user !== "object") return false;

  const normalizedUser = { ...user };
  if (normalizedUser.id === undefined && normalizedUser.tenant_id !== undefined) {
    normalizedUser.id = normalizedUser.tenant_id;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem("tenantUser", JSON.stringify(normalizedUser));
  }
  return true;
}

export function clearTenantSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("tenantUser");
  }
}

export function hasValidTenantSession() {
  return Boolean(getTenantId());
}
