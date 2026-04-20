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

export const unbanUser = (id: number) =>
  api.post(`/admin/users/${id}/unban/`);

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
export const getAnalyticsSummary = () =>
  api.get("/admin/analytics/summary/");

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

// Reports
export const getReports = (params?: Record<string, string | number>) =>
  api.get("/admin/reports/", { params });

export const getReport = (id: number) => api.get(`/admin/reports/${id}/`);

export const takeReportAction = (
  id: number,
  data: {
    action: string;
    notes?: string;
    ban_reason?: string;
    ban_expires_at?: string;
  },
) => api.post(`/admin/reports/${id}/take-action/`, data);
