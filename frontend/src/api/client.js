import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

export const checkHealth = async () => {
  try {
    const response = await apiClient.get("/health");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rankText = async (data) => {
  try {
    const response = await apiClient.post("/rank", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rankPdf = async (formData) => {
  try {
    const response = await apiClient.post("/rank_pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
