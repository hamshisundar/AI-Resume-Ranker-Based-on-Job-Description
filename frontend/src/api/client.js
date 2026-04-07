import axios from "axios";

const TOKEN_KEY = "cvfilter_access_token";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Best-effort message for FastAPI `{ detail }` or `{ error }` bodies. */
export function apiErrorMessage(error) {
  const d = error?.response?.data;
  if (!d) return error?.message || "Request failed";
  if (typeof d.error === "string") return d.error;
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) {
    const first = d.detail[0];
    if (first?.msg) return String(first.msg);
  }
  if (d.detail && typeof d.detail === "object" && typeof d.detail.error === "string") {
    return d.detail.error;
  }
  return error?.message || "Request failed";
}

function resolveApiBaseUrl() {
  if (import.meta.env.DEV) {
    return "/api";
  }
  return import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
}

const API_BASE_URL = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const t = getAccessToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export const fetchCsrfToken = async () => "";

export const checkHealth = async () => {
  const response = await apiClient.get("/health");
  return response.data;
};

export const fetchMe = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};

export const signupRequest = async ({ email, password }) => {
  const response = await apiClient.post("/auth/signup", { email, password });
  return response.data;
};

export const loginRequest = async ({ email, password }) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};

export const logoutRequest = async () => {
  const response = await apiClient.post("/auth/logout");
  return response.data;
};

export const rankText = async (data) => {
  const response = await apiClient.post("/rank", data);
  return response.data;
};

export const rankPdf = async (formData) => {
  const response = await apiClient.post("/rank_pdf", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const listRankingHistory = async () => {
  const response = await apiClient.get("/history");
  return response.data;
};

export const getRankingHistory = async (id) => {
  const response = await apiClient.get(`/history/${id}`);
  return response.data;
};

export const deleteRankingHistory = async (id) => {
  const response = await apiClient.delete(`/history/${id}`);
  return response.data;
};

export const listJobs = async () => {
  const response = await apiClient.get("/jobs");
  return response.data;
};

export const getJob = async (id) => {
  const response = await apiClient.get(`/jobs/${id}`);
  return response.data;
};

export default apiClient;
