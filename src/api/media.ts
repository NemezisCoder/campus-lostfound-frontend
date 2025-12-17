// src/api/media.ts

// Best practice: keep API origin in env (Vite)
const API_ORIGIN =
    (import.meta as any).env?.VITE_API_ORIGIN ||
    "http://localhost:8000";

export function resolveMediaUrl(url?: string | null) {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_ORIGIN}${url}`;
}
