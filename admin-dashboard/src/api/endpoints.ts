import api from "./client";

// Auth
export const login = (username: string, password: string) =>
  api.post("/users/login/", { username, password });

// Users
export const getUsers = (params?: Record<string, string | number>) =>
  api.get("/admin/users/", { params });

export const getUser = (id: number) => api.get(`/admin/users/${id}/`);

export const updateUser = (id: number, data: Record<string, unknown>) =>
  api.patch(`/admin/users/${id}/`, data);

export const banUser = (
  id: number,
  reason: string,
  expiresAt?: string | null,
) => api.post(`/admin/users/${id}/ban/`, { reason, expires_at: expiresAt });

export const unbanUser = (id: number) => api.post(`/admin/users/${id}/unban/`);

export const bulkUserAction = (data: {
  user_ids: number[];
  action: string;
  reason?: string;
  role?: number;
}) => api.post("/admin/users/bulk-action/", data);

// Tours
export const getTours = (params?: Record<string, string | number>) =>
  api.get("/admin/tours/", { params });

export const getTour = (id: number) => api.get(`/admin/tours/${id}/`);

export const deleteTour = (id: number) => api.delete(`/admin/tours/${id}/`);

export const approveTour = (id: number) =>
  api.post(`/admin/tours/${id}/approve/`);

export const rejectTour = (id: number, reason: string) =>
  api.post(`/admin/tours/${id}/reject/`, { reason });

export const archiveTour = (id: number) =>
  api.post(`/admin/tours/${id}/archive/`);

export const getTourAnalytics = (id: number) =>
  api.get(`/admin/tours/${id}/analytics/`);

// Analytics
export const getAnalyticsSummary = () => api.get("/admin/analytics/summary/");

export const getUserGrowth = (params?: Record<string, string | number>) =>
  api.get("/admin/analytics/user-growth/", { params });

export const getTourGrowth = (params?: Record<string, string | number>) =>
  api.get("/admin/analytics/tour-growth/", { params });

export const getTopTours = (params?: Record<string, string | number>) =>
  api.get("/admin/analytics/top-tours/", { params });

export const getDistributions = () =>
  api.get("/admin/analytics/distributions/");

export const getActiveUsers = (params?: Record<string, string | number>) =>
  api.get("/admin/analytics/active-users/", { params });

// Picture compare tuning
export const simulatePictureCompare = (data: FormData) =>
  api.post("/admin/picture-compare-tuning/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getPictureCompareConfig = () =>
  api.get("/admin/picture-compare-config/");

export const updatePictureCompareConfig = (data: Record<string, number>) =>
  api.post("/admin/picture-compare-config/", data);

// Badge visuals
export const getBadgeVisualBundle = () => api.get("/admin/badge-visuals/");

export const updateBadgeVisualTemplate = (config: Record<string, unknown>) =>
  api.post("/admin/badge-visuals/template/", { config });

export const upsertBadgeVisualOverride = (data: {
  badge?: number | null;
  country_code?: string;
  config: Record<string, unknown>;
}) => api.post("/admin/badge-visuals/overrides/", data);

export const deleteBadgeVisualOverride = (id: number) =>
  api.delete(`/admin/badge-visuals/overrides/${id}/`);

export const exportBadgeVisualConfig = () =>
  api.get("/admin/badge-visuals/export/", { responseType: "blob" });

// Reports
export const getReports = (params?: Record<string, string | number>) =>
  api.get("/admin/reports/", { params });

export const getReport = (id: number) => api.get(`/admin/reports/${id}/`);

export const takeReportAction = (
  id: number,
  data: {
    action: string;
    admin_notes?: string;
    ban_reason?: string;
    ban_expires_at?: string;
  },
) => api.post(`/admin/reports/${id}/take-action/`, data);
