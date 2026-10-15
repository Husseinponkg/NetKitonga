const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

export const API_BASE_URL = isDev ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || fallbackBaseUrl);
