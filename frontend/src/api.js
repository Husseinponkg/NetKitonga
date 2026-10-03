const fallbackBaseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:8000";

export const API_BASE_URL = import.meta.env.VITE_API_URL || fallbackBaseUrl;
