const apiHost = window.location.hostname || "localhost";

export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${apiHost}:8000`;
