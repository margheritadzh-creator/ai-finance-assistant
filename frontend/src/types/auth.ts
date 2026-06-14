export interface CurrentUser {
    id: number;
    email: string;
    displayName: string;
    role: string;
}

export interface AuthResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: CurrentUser;
}

export interface ApiErrorPayload {
    timestamp?: string;
    status?: number;
    error?: string;
    message?: string;
    path?: string;
    fieldErrors?: Record<string, string>;
}