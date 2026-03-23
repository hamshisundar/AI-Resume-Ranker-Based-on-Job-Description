import axios from "axios";

function resolveApiBaseUrl() {
  if (import.meta.env.DEV) {
    return "/api";
  }
  return import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5050";
}

const API_BASE_URL = resolveApiBaseUrl();

let csrfTokenRef = { current: null };

export function setCsrfTokenRef(ref) {
  csrfTokenRef = ref;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (method !== "get" && method !== "head") {
    const token = csrfTokenRef?.current;
    if (token) {
      config.headers["X-CSRF-Token"] = token;
    }
  }
  return config;
});

export const fetchCsrfToken = async () => {
  const response = await apiClient.get("/auth/csrf");
  return response.data.csrf_token;
};

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

export default apiClient;
