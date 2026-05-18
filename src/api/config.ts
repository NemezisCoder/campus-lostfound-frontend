export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

function getOriginFromUrl(url: string): string | null {
  try {
    return new URL(url, window.location.origin).origin;
  } catch {
    return null;
  }
}

export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")
    ? getOriginFromUrl(API_BASE_URL)
    : "") ||
  window.location.origin;
