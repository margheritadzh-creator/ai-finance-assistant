import { getAccessToken } from "@/lib/auth-storage";
import type {
    AdvisorStreamEvent,
    FinancialChatPayload,
} from "@/types/advisor";

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080"
).replace(/\/$/, "");

export class AdvisorStreamError extends Error {
    readonly status: number;

    constructor(
        message: string,
        status: number,
    ) {
        super(message);
        this.name = "AdvisorStreamError";
        this.status = status;
    }
}

interface StreamAdvisorReplyOptions {
    conversationId: number;
    message: string;
    signal?: AbortSignal;
    onEvent: (
        event: AdvisorStreamEvent,
    ) => void;
}

export async function streamAdvisorReply({
                                             conversationId,
                                             message,
                                             signal,
                                             onEvent,
                                         }: StreamAdvisorReplyOptions): Promise<void> {
    const token = getAccessToken();

    if (!token) {
        throw new AdvisorStreamError(
            "登录状态已经失效，请重新登录。",
            401,
        );
    }

    const payload: FinancialChatPayload = {
        message,
    };

    const response = await fetch(
        `${API_BASE_URL}/api/ai/advisor/conversations/${conversationId}/stream`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "text/event-stream",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal,
        },
    );

    if (!response.ok) {
        throw new AdvisorStreamError(
            await readErrorMessage(response),
            response.status,
        );
    }

    if (!response.body) {
        throw new AdvisorStreamError(
            "服务器没有返回可读取的流式内容。",
            500,
        );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";

    try {
        while (true) {
            const result = await reader.read();

            if (result.done) {
                break;
            }

            buffer += decoder.decode(
                result.value,
                {
                    stream: true,
                },
            );

            buffer = normalizeNewlines(buffer);

            let boundaryIndex =
                buffer.indexOf("\n\n");

            while (boundaryIndex !== -1) {
                const eventBlock =
                    buffer.slice(0, boundaryIndex);

                buffer = buffer.slice(
                    boundaryIndex + 2,
                );

                processEventBlock(
                    eventBlock,
                    onEvent,
                );

                boundaryIndex =
                    buffer.indexOf("\n\n");
            }
        }

        buffer += decoder.decode();
        buffer = normalizeNewlines(buffer);

        if (buffer.trim()) {
            processEventBlock(
                buffer,
                onEvent,
            );
        }
    } finally {
        reader.releaseLock();
    }
}

function processEventBlock(
    block: string,
    onEvent: (
        event: AdvisorStreamEvent,
    ) => void,
): void {
    const data = block
        .split("\n")
        .filter((line) =>
            line.startsWith("data:"),
        )
        .map((line) =>
            line.slice(5).trimStart(),
        )
        .join("\n");

    if (!data.trim()) {
        return;
    }

    let event: AdvisorStreamEvent;

    try {
        event = JSON.parse(
            data,
        ) as AdvisorStreamEvent;
    } catch {
        throw new AdvisorStreamError(
            "无法解析服务器返回的流式消息。",
            500,
        );
    }

    onEvent(event);

    if (event.type === "error") {
        throw new AdvisorStreamError(
            event.content ||
            "智能财务顾问回复失败。",
            500,
        );
    }
}

function normalizeNewlines(
    value: string,
): string {
    return value
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
}

async function readErrorMessage(
    response: Response,
): Promise<string> {
    try {
        const data = (await response.json()) as {
            message?: string;
            error?: string;
        };

        return (
            data.message ||
            data.error ||
            `请求失败，状态码${response.status}`
        );
    } catch {
        return `请求失败，状态码${response.status}`;
    }
}