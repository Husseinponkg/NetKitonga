const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

// Development talks to the local uvicorn server. In production the VPS routes
// /api/* to the FastAPI backend while every other path is served by the SPA,
// so the default production base MUST be the relative "/api" prefix. Using
// window.location.origin here (the previous default) makes the browser call
// e.g. https://netkitonga.com/packages/public, which returns the SPA HTML
// instead of JSON and breaks the captive portal with errors such as
// "Could not retrieve packages: ...". Override with VITE_API_URL only when
// the backend really is reachable on another origin.
export const API_BASE_URL = isDev
    ? 'http://localhost:8000'
    : (import.meta.env.VITE_API_URL || '/api');
