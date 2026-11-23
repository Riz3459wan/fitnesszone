import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let sessionExpiredHandled = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    const isLoginEndpoint = requestUrl.includes("/auth/login");
    const isAuthEndpoint =
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/check-subdomain") ||
      requestUrl.includes("/auth/gym/") ||
      requestUrl.includes("/auth/me");

    if (
      status === 401 &&
      !isLoginEndpoint &&
      !isAuthEndpoint &&
      !sessionExpiredHandled
    ) {
      sessionExpiredHandled = true;
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      toast.error("Session expired. Please login again.");
      setTimeout(() => {
        sessionExpiredHandled = false;
      }, 2000);
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (email, password, subdomain) =>
    api.post("/auth/login", { email, password, subdomain }),
  logout: () => api.post("/auth/logout", {}),
  register: (userData) => api.post("/auth/register", userData),
  me: () => api.get("/auth/me"),
  getGymBySubdomain: (subdomain) =>
    api.get(`/auth/gym/${encodeURIComponent(subdomain)}`),
  checkSubdomain: (subdomain) =>
    api.get(`/auth/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`),
};

export const memberAPI = {
  getAll: () => api.get("/members"),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post("/members", data),
  update: (id, data) => api.put(`/members/${id}`, data),
  updateStatus: (id, active) =>
    api.patch(`/members/${id}/status`, null, {
      params: { active },
    }),
  delete: (id) => api.delete(`/members/${id}`),
  search: (term) => api.get(`/members/search?term=${encodeURIComponent(term)}`),
  getByDateRange: (startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/members?${params}`);
  },
};

export const attendanceAPI = {
  getToday: () => api.get("/attendance"),
  getByDate: (date) => api.get(`/attendance/date/${encodeURIComponent(date)}`),
  checkIn: (memberId) => api.post(`/attendance/checkin/${memberId}`),
  checkOut: (memberId) => api.post(`/attendance/checkout/${memberId}`),
  getStats: () => api.get("/attendance/stats"),
  getStatsByDateRange: (startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/attendance/stats?${params}`);
  },
  getExportData: () => api.get("/attendance/export"),
};

export const paymentAPI = {
  getAll: () => api.get("/payments"),
  getById: (id) => api.get(`/payments/${id}`),
  getByMember: (memberId) => api.get(`/payments/member/${memberId}`),
  create: (data) => api.post("/payments", data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  updateStatus: (id, status) =>
    api.put(`/payments/${id}/status?status=${encodeURIComponent(status)}`),
  delete: (id) => api.delete(`/payments/${id}`),
  getSummary: () => api.get("/payments/summary"),
  getByDateRange: (startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/payments?${params}`);
  },
};

export const razorpayAPI = {
  createOrder: (data) => api.post("/payments/razorpay/create-order", data),
  verifyPayment: (data) => api.post("/payments/razorpay/verify", data),
  createSubscriptionOrder: (data) =>
    api.post("/subscription/razorpay/create-order", data),
  verifySubscription: (data) => api.post("/subscription/razorpay/verify", data),
};

export const planAPI = {
  getAll: () => api.get("/plans"),
  getById: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post("/plans", data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  delete: (id) => api.delete(`/plans/${id}`),
};

export const userAPI = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  changePassword: (data) => api.post("/users/change-password", data),
  search: (keyword) =>
    api.get(`/users/search?keyword=${encodeURIComponent(keyword)}`),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRevenue: () => api.get("/dashboard/revenue"),
  getRecentActivities: () => api.get("/dashboard/recent-activities"),
};

export const settingsAPI = {
  get: () => api.get("/settings"),
  save: (data) => api.post("/settings", data),
  reset: () => api.post("/settings/reset"),
};

export const notificationsAPI = {
  getAll: () => api.get("/notifications"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const announcementsAPI = {
  getAll: () => api.get("/announcements"),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post("/announcements", data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  togglePin: (id) => api.patch(`/announcements/${id}/pin`),
};

export const reportAPI = {
  getMembers: (startDate, endDate, memberId) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (memberId) params.append("memberId", memberId);
    return api.get(`/reports/members?${params}`);
  },
  getAttendance: (startDate, endDate, memberId) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (memberId) params.append("memberId", memberId);
    return api.get(`/reports/attendance?${params}`);
  },
  getPayments: (startDate, endDate, memberId) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (memberId) params.append("memberId", memberId);
    return api.get(`/reports/payments?${params}`);
  },
  getRevenue: (startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate });
    return api.get(`/reports/revenue?${params}`);
  },
};

export const subscriptionAPI = {
  getStatus: () => api.get("/subscription/status"),
  activate: (planId, planName) =>
    api.post(`/subscription/activate?planId=${planId}&planName=${planName}`),
};

export default api;
