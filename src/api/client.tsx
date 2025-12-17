import axios from "axios";

export const api = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
});

const TOKEN_KEY = "access_token";

// ✅ подхватываем токен сразу при импорте модуля
let accessToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setAccessToken(token: string | null) {
    accessToken = token;

    // ✅ сохраняем/чистим localStorage
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
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

        if (!original || status !== 401) return Promise.reject(error);

        if (
            url.includes("/auth/refresh") ||
            url.includes("/auth/login") ||
            url.includes("/auth/register")
        ) {
            return Promise.reject(error);
        }

        if ((original as any)._retry) return Promise.reject(error);
        (original as any)._retry = true;

        if (!refreshPromise) {
            refreshPromise = api
                .post("/auth/refresh")
                .then((r) => {
                    const t = r.data.access_token as string;
                    setAccessToken(t); // ✅ теперь ещё и сохраняется в localStorage
                    return t;
                })
                .catch(() => {
                    setAccessToken(null);
                    return null;
                })
                .finally(() => {
                    refreshPromise = null;
                });
        }

        const newToken = await refreshPromise;
        if (!newToken) return Promise.reject(error);

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
    }
);
