import type { AuthResponse, CurrentUser } from "@/types/auth";

const ACCESS_TOKEN_KEY = "finance_access_token";
const CURRENT_USER_KEY = "finance_current_user";

export function saveAuth(auth: AuthResponse): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(
        ACCESS_TOKEN_KEY,
        auth.accessToken,
    );

    window.localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(auth.user),
    );
}

export function getAccessToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): CurrentUser | null {
    if (typeof window === "undefined") {
        return null;
    }

    const value = window.localStorage.getItem(CURRENT_USER_KEY);

    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as CurrentUser;
    } catch {
        clearAuth();
        return null;
    }
}

export function clearAuth(): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(CURRENT_USER_KEY);
}