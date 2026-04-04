import axios from "axios";

export const api = axios.create({
    baseURL: "/api/v1",
});

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let accessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);
let refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_KEY);

export function setAccessToken(token: string | null) {
    accessToken = token;

    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getAccessToken(): string | null {
    return accessToken;
}

export function setRefreshToken(token: string | null) {
    refreshToken = token;

    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    return refreshToken;
}

export function clearTokens() {
    setAccessToken(null);
    setRefreshToken(null);
}

function notifyAuthInvalid() {
    window.dispatchEvent(new Event("auth:invalid"));
}

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        const status = error.response?.status;
        const url = (original?.url ?? "") as string;

        if (!original || status !== 401) {
            return Promise.reject(error);
        }

        if (
            url.includes("/auth/refresh") ||
            url.includes("/auth/login") ||
            url.includes("/auth/register") ||
            url.includes("/auth/logout")
        ) {
            return Promise.reject(error);
        }

        if ((original as any)._retry) {
            return Promise.reject(error);
        }
        (original as any)._retry = true;

        if (!refreshPromise) {
            refreshPromise = (async () => {
                const currentRefreshToken = getRefreshToken();

                if (!currentRefreshToken) {
                    clearTokens();
                    notifyAuthInvalid();
                    return null;
                }

                try {
                    const response = await api.post("/auth/refresh", {
                        refresh_token: currentRefreshToken,
                    });

                    const newAccessToken = response.data.access_token as string;
                    const newRefreshToken = response.data.refresh_token as string;

                    setAccessToken(newAccessToken);
                    setRefreshToken(newRefreshToken);

                    return newAccessToken;
                } catch {
                    clearTokens();
                    notifyAuthInvalid();
                    return null;
                } finally {
                    refreshPromise = null;
                }
            })();
        }

        const newToken = await refreshPromise;
        if (!newToken) {
            return Promise.reject(error);
        }

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
    }
);