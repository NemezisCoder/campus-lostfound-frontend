// src/api/auth.ts
import { api, clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from "./client";

export type AuthResponse = {
    access_token: string;
    refresh_token: string;
    token_type: "bearer" | string;
};

export type MeResponse = {
    id: number;
    email?: string;
    name?: string;
    surname?: string;
    role?: "user" | "admin";
    is_banned?: boolean;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });

    setAccessToken(res.data.access_token);
    setRefreshToken(res.data.refresh_token);

    return res.data;
}

export async function register(payload: {
    name: string;
    surname: string;
    email: string;
    password: string;
}) {
    const res = await api.post("/auth/register", payload);
    return res.data;
}

export async function logout() {
    const refreshToken = getRefreshToken();

    try {
        if (refreshToken) {
            await api.post("/auth/logout", {
                refresh_token: refreshToken,
            });
        }
    } finally {
        clearTokens();
    }
}

export async function fetchMe(): Promise<MeResponse> {
    const res = await api.get<MeResponse>("/auth/me");
    const raw = res.data ?? ({} as MeResponse);

    return {
        id: raw.id,
        email: raw.email,
        name: raw.name ?? "",
        surname: raw.surname ?? "",
        role: raw.role ?? "user",
        is_banned: raw.is_banned ?? false,
    };
}