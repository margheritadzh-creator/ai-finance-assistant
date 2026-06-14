import { getAccessToken } from "@/lib/auth-storage";
import type { ApiErrorPayload } from "@/types/auth";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080";

export class ApiError extends Error {
    readonly status: number;
    readonly fieldErrors: Record<string, string>;

    constructor(
        message: string,
        status: number,
        fieldErrors: Record<string, string> = {},
    ) {
        super(message);

        this.name = "ApiError";
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

interface ApiRequestOptions extends RequestInit {
    authenticated?: boolean;
}

export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const {
        authenticated = true,
        headers: providedHeaders,
        ...requestOptions
    } = options;

    const headers = new Headers(providedHeaders);

    if (
        requestOptions.body &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    if (authenticated) {
        const token = getAccessToken();

        if (!token) {
            throw new ApiError("登录状态已失效，请重新登录", 401);
        }

        headers.set("Authorization", `Bearer ${token}`);
    }

    let response: Response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...requestOptions,
            headers,
            cache: "no-store",
        });
    } catch {
        throw new ApiError(
            "无法连接后端服务，请确认后端已启动",
            0,
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType =
        response.headers.get("content-type") ?? "";

    const payload = contentType.includes("application/json")
        ? ((await response.json()) as ApiErrorPayload)
        : null;

    if (!response.ok) {
        throw new ApiError(
            payload?.message ?? `请求失败：${response.status}`,
            response.status,
            payload?.fieldErrors ?? {},
        );
    }

    return payload as T;
}