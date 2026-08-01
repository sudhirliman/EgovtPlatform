// Complete fetch wrapper for the egov-platform backend.
// Point API_BASE at your backend, e.g. via a .env: VITE_API_BASE=http://localhost:8080

import { getStoredToken } from "../auth/AuthContext.jsx";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:8080";

async function request(path, options = {}) {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    // Token missing/expired/invalid for an endpoint that requires auth - force
    // a re-login rather than silently failing every subsequent call.
    localStorage.removeItem("egov_auth_token");
    window.location.href = "/login";
    throw new Error("Session expired - please log in again");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} on ${path}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const qs = (params) => {
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries)}` : "";
};

// ---- Hierarchy ----
export const boardsApi = {
  list: () => request("/api/boards"),
  create: (data) => request("/api/boards", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/boards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deactivate: (id) => request(`/api/boards/${id}/deactivate`, { method: "PATCH" }),
};

export const departmentsApi = {
  list: (boardId) => request(`/api/departments${qs({ boardId })}`),
  create: (data) => request("/api/departments", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deactivate: (id) => request(`/api/departments/${id}/deactivate`, { method: "PATCH" }),
};

export const servicesApi = {
  list: (departmentId) => request(`/api/services${qs({ departmentId })}`),
  get: (id) => request(`/api/services/${id}`),
  create: (data) => request("/api/services", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deactivate: (id) => request(`/api/services/${id}/deactivate`, { method: "PATCH" }),
};

// ---- RBAC ----
export const rolesApi = {
  list: () => request("/api/roles"),
  create: (data) => request("/api/roles", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export const permissionsApi = {
  list: () => request("/api/permissions"),
};

export const usersApi = {
  list: () => request("/api/users"),
  create: (data) => request("/api/users", { method: "POST", body: JSON.stringify(data) }),
  byRole: (roleId) => request(`/api/users/by-role/${roleId}`),
  rolesFor: (userId) => request(`/api/users/${userId}/roles`),
  assignRole: (data) => request("/api/user-roles", { method: "POST", body: JSON.stringify(data) }),
};

// ---- Form designer ----
export const formDesignerApi = {
  fields: (serviceId) => request(`/api/services/${serviceId}/form-designer/fields`),
  addField: (serviceId, data) =>
    request(`/api/services/${serviceId}/form-designer/fields`, { method: "POST", body: JSON.stringify(data) }),
  updateField: (serviceId, fieldId, data) =>
    request(`/api/services/${serviceId}/form-designer/fields/${fieldId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteField: (serviceId, fieldId) =>
    request(`/api/services/${serviceId}/form-designer/fields/${fieldId}`, { method: "DELETE" }),
  reorderFields: (serviceId, orderedIds) =>
    request(`/api/services/${serviceId}/form-designer/fields/reorder`, { method: "PATCH", body: JSON.stringify({ orderedIds }) }),
  documents: (serviceId) => request(`/api/services/${serviceId}/form-designer/documents`),
  addDocument: (serviceId, data) =>
    request(`/api/services/${serviceId}/form-designer/documents`, { method: "POST", body: JSON.stringify(data) }),
  updateDocument: (serviceId, docId, data) =>
    request(`/api/services/${serviceId}/form-designer/documents/${docId}`, { method: "PUT", body: JSON.stringify(data) }),
  deactivateDocument: (serviceId, docId) =>
    request(`/api/services/${serviceId}/form-designer/documents/${docId}/deactivate`, { method: "PATCH" }),
  reorderDocuments: (serviceId, orderedIds) =>
    request(`/api/services/${serviceId}/form-designer/documents/reorder`, { method: "PATCH", body: JSON.stringify({ orderedIds }) }),
  schema: (serviceId) => request(`/api/services/${serviceId}/form-schema`),
};

// ---- Workflow builder + runtime actions ----
export const workflowApi = {
  list: (serviceId) => request(`/api/workflows${qs({ serviceId })}`),
  create: (data) => request("/api/workflows", { method: "POST", body: JSON.stringify(data) }),
  stages: (workflowId) => request(`/api/workflows/${workflowId}/stages`),
  addStage: (workflowId, data) =>
    request(`/api/workflows/${workflowId}/stages`, { method: "POST", body: JSON.stringify(data) }),
  updateStage: (workflowId, stageId, data) =>
    request(`/api/workflows/${workflowId}/stages/${stageId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStage: (workflowId, stageId) =>
    request(`/api/workflows/${workflowId}/stages/${stageId}`, { method: "DELETE" }),
  reorderStages: (workflowId, orderedStageIds) =>
    request(`/api/workflows/${workflowId}/stages/reorder`, { method: "PATCH", body: JSON.stringify({ orderedStageIds }) }),
  stageRoles: (workflowId, stageId) => request(`/api/workflows/${workflowId}/stages/${stageId}/roles`),
  eligibleOfficers: (workflowId, stageId) => request(`/api/workflows/${workflowId}/stages/${stageId}/eligible-officers`),
  submit: (applicationId) => request(`/api/applications/${applicationId}/workflow/submit`, { method: "POST" }),
  forward: (applicationId, data) =>
    request(`/api/applications/${applicationId}/workflow/forward`, { method: "POST", body: JSON.stringify(data) }),
  sendBack: (applicationId, data) =>
    request(`/api/applications/${applicationId}/workflow/send-back`, { method: "POST", body: JSON.stringify(data) }),
};

// ---- Applications ----
export const applicationsApi = {
  list: (params) => request(`/api/applications${qs(params)}`),
  get: (id) => request(`/api/applications/${id}`),
  documents: (id) => request(`/api/applications/${id}/documents`),
  history: (id) => request(`/api/applications/${id}/history`),
  workflowInstance: (id) => request(`/api/applications/${id}/workflow-instance`),
  createDraft: (data) => request("/api/applications/draft", { method: "POST", body: JSON.stringify(data) }),
  updateDraft: (id, data) => request(`/api/applications/${id}/draft`, { method: "PUT", body: JSON.stringify(data) }),
  submit: (id) => request(`/api/applications/${id}/submit`, { method: "POST" }),
};

// ---- Payments ----
export const paymentsApi = {
  listChallans: (applicationId) => request(`/api/challans${qs({ applicationId })}`),
  allSettled: (applicationId) => request(`/api/challans/application/${applicationId}/settled`),
  generateChallan: (data) => request("/api/challans", { method: "POST", body: JSON.stringify(data) }),
  payOnline: (challanId, data) =>
    request(`/api/challans/${challanId}/pay/online`, { method: "POST", body: JSON.stringify(data) }),
  payOffline: (challanId, data) =>
    request(`/api/challans/${challanId}/pay/offline`, { method: "POST", body: JSON.stringify(data) }),
  verifyOffline: (transactionId, verifiedByUserId, approve) =>
    request(`/api/challans/payments/${transactionId}/verify${qs({ verifiedByUserId, approve })}`, { method: "POST" }),
};

// ---- Tickets ----
export const ticketsApi = {
  listMine: (raisedByUserId) => request(`/api/tickets${qs({ raisedByUserId })}`),
  create: (data) => request("/api/tickets", { method: "POST", body: JSON.stringify(data) }),
  messages: (ticketId) => request(`/api/tickets/${ticketId}/messages`),
  addMessage: (ticketId, data) =>
    request(`/api/tickets/${ticketId}/messages`, { method: "POST", body: JSON.stringify(data) }),
  changeStatus: (ticketId, status, changedBy) =>
    request(`/api/tickets/${ticketId}/status${qs({ status, changedBy })}`, { method: "PATCH" }),
};

// ---- Reports ----
export const reportsApi = {
  pendency: (params) => request(`/api/reports/pendency${qs(params)}`),
};

export const masterFormFieldsApi = {
  list: () => request("/api/master-form-fields"),
  create: (data) => request("/api/master-form-fields", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/master-form-fields/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/api/master-form-fields/${id}`, { method: "DELETE" }),
  deactivate: (id) => request(`/api/master-form-fields/${id}/deactivate`, { method: "PATCH" }),
};

// ---- Theme ----
export const themeApi = {
  get: (boardId) => request(`/api/theme${qs({ boardId })}`),
};
