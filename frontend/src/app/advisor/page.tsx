"use client";

import {
  useRouter } from "next/navigation";
import {
    type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  } from "react";

import {
    AlertTriangle,
  Archive,
  Bot,
  LoaderCircle,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
    AdvisorStreamError,
    streamAdvisorReply,
} from "@/lib/advisor-stream";
import {
    apiRequest,
    ApiError,
} from "@/lib/api";
import {
    clearAuth,
    getAccessToken,
} from "@/lib/auth-storage";
import {
    formatDateTime,
} from "@/lib/format";
import type {
    AdvisorConversation,
    AdvisorConversationPage,
    AdvisorMessage,
} from "@/types/advisor";
import type {
    CurrentUser,
} from "@/types/auth";

import { MarkdownContent } from "@/components/markdown-content";

import {
    FinanceHeader,
} from "@/components/finance-header";

const CONVERSATION_PAGE_SIZE = 50;
const MAX_MESSAGE_LENGTH = 4000;

const suggestedQuestions = [
    "根据我的消费记录，分析本月最需要控制的支出。",
    "我的预算设置是否合理？请给出调整建议。",
    "根据历史账单，预测下个月可能增加的消费。",
    "请帮我制定一个适合当前消费习惯的省钱计划。",
];

export default function AdvisorPage() {
    const router = useRouter();

    const messageEndRef =
        useRef<HTMLDivElement | null>(null);

    const streamControllerRef =
        useRef<AbortController | null>(null);

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [
        conversations,
        setConversations,
    ] = useState<AdvisorConversation[]>([]);

    const [
        activeConversationId,
        setActiveConversationId,
    ] = useState<number | null>(null);

    const [messages, setMessages] =
        useState<AdvisorMessage[]>([]);

    const [input, setInput] =
        useState("");

    const [
        streamingContent,
        setStreamingContent,
    ] = useState("");

    const [loading, setLoading] =
        useState(true);

    const [
        messagesLoading,
        setMessagesLoading,
    ] = useState(false);

    const [
        creatingConversation,
        setCreatingConversation,
    ] = useState(false);

    const [streaming, setStreaming] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const handleUnauthorized = useCallback(
        (error: unknown): boolean => {
            const unauthorized =
                (error instanceof ApiError &&
                    error.status === 401) ||
                (error instanceof AdvisorStreamError &&
                    error.status === 401);

            if (!unauthorized) {
                return false;
            }

            clearAuth();
            router.replace("/login");

            return true;
        },
        [router],
    );

    const loadPage =
        useCallback(async () => {
            const token = getAccessToken();

            if (!token) {
                router.replace("/login");
                return;
            }

            setLoading(true);
            setErrorMessage("");

            try {
                const [
                    currentUser,
                    conversationPage,
                ] = await Promise.all([
                    apiRequest<CurrentUser>(
                        "/api/auth/me",
                    ),

                    apiRequest<AdvisorConversationPage>(
                        `/api/ai/advisor/conversations?page=0&size=${CONVERSATION_PAGE_SIZE}`,
                    ),
                ]);

                setUser(currentUser);
                setConversations(
                    conversationPage.content,
                );

                const firstConversation =
                    conversationPage.content[0];

                if (firstConversation) {
                    setActiveConversationId(
                        firstConversation.id,
                    );

                    const history =
                        await apiRequest<
                            AdvisorMessage[]
                        >(
                            `/api/ai/advisor/conversations/${firstConversation.id}/messages`,
                        );

                    setMessages(history);
                } else {
                    setActiveConversationId(null);
                    setMessages([]);
                }
            } catch (error) {
                if (handleUnauthorized(error)) {
                    return;
                }

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "智能财务顾问加载失败。",
                );
            } finally {
                setLoading(false);
            }
        }, [handleUnauthorized, router]);

    useEffect(() => {
        const timerId = window.setTimeout(
            () => {
                void loadPage();
            },
            0,
        );

        return () => {
            window.clearTimeout(timerId);
        };
    }, [loadPage]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [
        messages,
        streamingContent,
        streaming,
    ]);

    useEffect(() => {
        return () => {
            streamControllerRef.current?.abort();
        };
    }, []);


    async function refreshConversations() {
        const response =
            await apiRequest<AdvisorConversationPage>(
                `/api/ai/advisor/conversations?page=0&size=${CONVERSATION_PAGE_SIZE}`,
            );

        setConversations(response.content);

        return response.content;
    }

    async function selectConversation(
        conversationId: number,
    ) {
        if (
            streaming ||
            conversationId ===
            activeConversationId
        ) {
            return;
        }

        setActiveConversationId(
            conversationId,
        );

        setMessages([]);
        setStreamingContent("");
        setMessagesLoading(true);
        setErrorMessage("");

        try {
            const history =
                await apiRequest<
                    AdvisorMessage[]
                >(
                    `/api/ai/advisor/conversations/${conversationId}/messages`,
                );

            setMessages(history);
        } catch (error) {
            handleUnauthorized(error);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "历史消息加载失败。",
            );
        } finally {
            setMessagesLoading(false);
        }
    }

    async function createConversation(
        title = "新的财务咨询",
    ): Promise<AdvisorConversation | null> {
        setCreatingConversation(true);
        setErrorMessage("");

        try {
            const conversation =
                await apiRequest<AdvisorConversation>(
                    "/api/ai/advisor/conversations",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            title: title.slice(0, 150),
                        }),
                    },
                );

            setConversations((current) => [
                conversation,
                ...current.filter(
                    (item) =>
                        item.id !== conversation.id,
                ),
            ]);

            setActiveConversationId(
                conversation.id,
            );

            setMessages([]);
            setStreamingContent("");

            return conversation;
        } catch (error) {
            handleUnauthorized(error);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "创建新会话失败。",
            );

            return null;
        } finally {
            setCreatingConversation(false);
        }
    }

    async function archiveConversation(
        conversation: AdvisorConversation,
    ) {
        if (streaming) {
            return;
        }

        const confirmed = window.confirm(
            `确定归档“${conversation.title}”吗？`,
        );

        if (!confirmed) {
            return;
        }

        setErrorMessage("");

        try {
            await apiRequest<AdvisorConversation>(
                `/api/ai/advisor/conversations/${conversation.id}/archive`,
                {
                    method: "PATCH",
                },
            );

            const remaining =
                await refreshConversations();

            if (
                activeConversationId ===
                conversation.id
            ) {
                const nextConversation =
                    remaining.find(
                        (item) =>
                            item.id !== conversation.id,
                    );

                if (nextConversation) {
                    await selectConversation(
                        nextConversation.id,
                    );
                } else {
                    setActiveConversationId(null);
                    setMessages([]);
                    setStreamingContent("");
                }
            }
        } catch (error) {
            handleUnauthorized(error);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "归档会话失败。",
            );
        }
    }

    async function sendMessage() {
        const message = input.trim();

        if (
            !message ||
            streaming ||
            message.length >
            MAX_MESSAGE_LENGTH
        ) {
            return;
        }

        setErrorMessage("");

        let conversationId =
            activeConversationId;

        if (!conversationId) {
            const title =
                createConversationTitle(message);

            const conversation =
                await createConversation(title);

            if (!conversation) {
                return;
            }

            conversationId = conversation.id;
        }

        const optimisticMessage:
            AdvisorMessage = {
            id: -Date.now(),
            conversationId,
            role: "USER",
            content: message,
            modelName: null,
            promptTokens: null,
            completionTokens: null,
            createdAt:
                new Date().toISOString(),
        };

        setMessages((current) => [
            ...current,
            optimisticMessage,
        ]);

        setInput("");
        setStreamingContent("");
        setStreaming(true);

        const controller =
            new AbortController();

        streamControllerRef.current =
            controller;

        try {
            await streamAdvisorReply({
                conversationId,
                message,
                signal: controller.signal,

                onEvent: (event) => {
                    if (
                        event.type === "delta" &&
                        event.content
                    ) {
                        setStreamingContent(
                            (current) =>
                                current + event.content,
                        );
                    }
                },
            });

            const [
                savedMessages,
                conversationPage,
            ] = await Promise.all([
                apiRequest<AdvisorMessage[]>(
                    `/api/ai/advisor/conversations/${conversationId}/messages`,
                ),

                apiRequest<AdvisorConversationPage>(
                    `/api/ai/advisor/conversations?page=0&size=${CONVERSATION_PAGE_SIZE}`,
                ),
            ]);

            setMessages(savedMessages);
            setConversations(
                conversationPage.content,
            );
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === "AbortError"
            ) {
                return;
            }

            handleUnauthorized(error);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "智能财务顾问回复失败。",
            );
        } finally {
            setStreaming(false);
            setStreamingContent("");
            streamControllerRef.current = null;
        }
    }

    const activeConversation =
        conversations.find(
            (conversation) =>
                conversation.id ===
                activeConversationId,
        ) ?? null;

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="flex items-center gap-3 text-[#344054]">
                    <LoaderCircle
                        size={21}
                        className="animate-spin text-[#9b733a]"
                    />
                    正在加载智能财务顾问
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <div className="finance-surface max-w-md rounded-[24px] p-8 text-center">
                    <AlertTriangle
                        size={28}
                        className="mx-auto text-amber-600"
                    />

                    <p className="mt-4 text-[#4a5568]">
                        {errorMessage ||
                            "暂时无法加载智能财务顾问"}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void loadPage()
                        }
                        className="mt-5 rounded-[13px] bg-[#09152f] px-5 py-3 text-sm font-medium text-white"
                    >
                        重新加载
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
            <div className="mx-auto max-w-[1480px]">
                <FinanceHeader
                    displayName={user.displayName}
                    email={user.email}
                    onBeforeLogout={() => {
                        streamControllerRef.current?.abort();
                    }}
                />

                {errorMessage && (
                    <div className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle
                            size={17}
                            className="mt-0.5 shrink-0"
                        />
                        {errorMessage}
                    </div>
                )}

                <section className="mt-7 grid min-h-[760px] gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="finance-surface flex min-h-[640px] flex-col overflow-hidden rounded-[25px]">
                        <div className="border-b border-[#e6e8ec] p-5">
                            <button
                                type="button"
                                onClick={() =>
                                    void createConversation()
                                }
                                disabled={
                                    creatingConversation ||
                                    streaming
                                }
                                className="finance-primary-button"
                            >
                                {creatingConversation ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Plus size={17} />
                                )}

                                新建咨询
                            </button>
                        </div>

                        <div className="px-5 pb-3 pt-5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-[#9b733a]">
                                历史会话
                            </p>

                            <p className="mt-2 text-xs text-[#9299a5]">
                                共{conversations.length}
                                个财务咨询
                            </p>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
                            {conversations.length === 0 ? (
                                <div className="px-4 py-12 text-center">
                                    <MessageCircle
                                        size={25}
                                        className="mx-auto text-[#b3b8c1]"
                                    />

                                    <p className="mt-3 text-sm text-[#8b93a0]">
                                        还没有历史会话
                                    </p>
                                </div>
                            ) : (
                                conversations.map(
                                    (conversation) => {
                                        const active =
                                            conversation.id ===
                                            activeConversationId;

                                        return (
                                            <div
                                                key={conversation.id}
                                                className={[
                                                    "group flex items-start gap-2 rounded-[16px] border p-2 transition",
                                                    active
                                                        ? "border-[#d8c49f] bg-[#f7f0e3]"
                                                        : "border-transparent hover:border-[#e2e4e8] hover:bg-[#f8f8f7]",
                                                ].join(" ")}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void selectConversation(
                                                            conversation.id,
                                                        )
                                                    }
                                                    className="min-w-0 flex-1 px-2 py-2 text-left"
                                                >
                                                    <p className="truncate text-sm font-medium text-[#344054]">
                                                        {conversation.title}
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-[#9299a5]">
                                                        {formatConversationTime(
                                                            conversation.updatedAt,
                                                        )}
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void archiveConversation(
                                                            conversation,
                                                        )
                                                    }
                                                    disabled={streaming}
                                                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#9299a5] opacity-0 transition hover:bg-white hover:text-[#8a642f] group-hover:opacity-100"
                                                    aria-label="归档会话"
                                                    title="归档会话"
                                                >
                                                    <Archive size={14} />
                                                </button>
                                            </div>
                                        );
                                    },
                                )
                            )}
                        </div>
                    </aside>

                    <section className="finance-surface flex min-h-[760px] min-w-0 flex-col overflow-hidden rounded-[25px]">
                        <div className="flex flex-col gap-4 border-b border-[#e6e8ec] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#09152f] text-[#dec79f]">
                                    <Sparkles size={20} />
                                </div>

                                <div>
                                    <p className="font-semibold text-[#273147]">
                                        {activeConversation
                                                ?.title ||
                                            "智能财务顾问"}
                                    </p>

                                    <p className="mt-1 text-xs text-[#9299a5]">
                                        结合个人账单、预算和消费偏好提供建议
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-full border border-[#ded4c2] bg-[#fbf7ef] px-3 py-1.5 text-xs text-[#79613d]">
                                当前用户：{user.displayName}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fbfaf7_0%,#f7f7f8_100%)] px-4 py-6 sm:px-7">
                            {messagesLoading ? (
                                <div className="flex h-full min-h-[450px] items-center justify-center gap-3 text-sm text-[#697386]">
                                    <LoaderCircle
                                        size={18}
                                        className="animate-spin text-[#9b733a]"
                                    />
                                    正在加载历史消息
                                </div>
                            ) : messages.length === 0 &&
                            !streaming ? (
                                <AdvisorWelcome
                                    onSelectQuestion={
                                        setInput
                                    }
                                />
                            ) : (
                                <div className="mx-auto max-w-4xl space-y-6">
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                        />
                                    ))}

                                    {streaming && (
                                        <StreamingBubble
                                            content={
                                                streamingContent
                                            }
                                        />
                                    )}

                                    <div
                                        ref={messageEndRef}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-[#e3e5e9] bg-white/90 p-4 backdrop-blur sm:p-6">
                            <div className="mx-auto max-w-4xl">
                                <div className="rounded-[20px] border border-[#d9dde4] bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.07)] transition focus-within:border-[#c4a36a] focus-within:ring-4 focus-within:ring-[#c4a36a]/12">
                  <textarea
                      value={input}
                      onChange={(event) =>
                          setInput(
                              event.target.value,
                          )
                      }
                      onKeyDown={(event) => {
                          if (
                              event.key === "Enter" &&
                              !event.shiftKey
                          ) {
                              event.preventDefault();
                              void sendMessage();
                          }
                      }}
                      maxLength={
                          MAX_MESSAGE_LENGTH
                      }
                      rows={3}
                      disabled={streaming}
                      placeholder="例如：请分析我本月的消费结构，并给出三条具体建议。"
                      className="w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-7 text-[#1f2937] outline-none placeholder:text-[#a1a8b3]"
                  />

                                    <div className="flex items-center justify-between gap-4 border-t border-[#edf0f3] px-2 pt-3">
                                        <p className="text-[11px] text-[#9aa1ad]">
                                            按回车发送，按
                                            Shift＋回车换行
                                        </p>

                                        <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#9aa1ad]">
                        {input.length}/
                          {MAX_MESSAGE_LENGTH}
                      </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void sendMessage()
                                                }
                                                disabled={
                                                    streaming ||
                                                    !input.trim()
                                                }
                                                className="flex h-10 items-center justify-center gap-2 rounded-[13px] bg-[#09152f] px-4 text-sm font-medium text-white transition hover:bg-[#12264a] disabled:cursor-not-allowed disabled:opacity-45"
                                            >
                                                {streaming ? (
                                                    <LoaderCircle
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Send size={16} />
                                                )}

                                                {streaming
                                                    ? "正在回复"
                                                    : "发送"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 text-center text-[11px] leading-5 text-[#9aa1ad]">
                                    财务建议仅用于日常消费管理参考，不构成投资、税务或法律意见。
                                </p>
                            </div>
                        </div>
                    </section>
                </section>
            </div>
        </main>
    );
}

interface MessageBubbleProps {
    message: AdvisorMessage;
}

function MessageBubble({
                           message,
                       }: MessageBubbleProps) {
    const isUser =
        message.role.toUpperCase() === "USER";

    return (
        <div
            className={[
                "flex gap-3",
                isUser
                    ? "justify-end"
                    : "justify-start",
            ].join(" ")}
        >
            {!isUser && (
                <MessageAvatar
                    icon={<Bot size={17} />}
                    className="bg-[#09152f] text-[#dec79f]"
                />
            )}

            <div
                className={[
                    "max-w-[86%]",
                    isUser
                        ? "text-right"
                        : "text-left",
                ].join(" ")}
            >
                <div
                    className={[
                        "inline-block rounded-[20px] px-5 py-4 text-left",
                        isUser
                            ? "rounded-br-[7px] bg-[#102445] text-white shadow-[0_12px_28px_rgba(9,21,47,0.16)]"
                            : "rounded-bl-[7px] border border-[#e0e3e8] bg-white text-[#344054] shadow-[0_10px_26px_rgba(15,23,42,0.055)]",
                    ].join(" ")}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap text-sm leading-7">
                            {message.content}
                        </p>
                    ) : (
                        <MarkdownContent
                            content={message.content}
                        />
                    )}
                </div>

                <p className="mt-2 px-1 text-[10px] text-[#9aa1ad]">
                    {formatDateTime(
                        message.createdAt,
                    )}
                </p>
            </div>

            {isUser && (
                <MessageAvatar
                    icon={
                        <UserRound size={17} />
                    }
                    className="bg-[#e9eef8] text-[#34548a]"
                />
            )}
        </div>
    );
}

function StreamingBubble({
                             content,
                         }: {
    content: string;
}) {
    return (
        <div className="flex justify-start gap-3">
            <MessageAvatar
                icon={<Bot size={17} />}
                className="bg-[#09152f] text-[#dec79f]"
            />

            <div className="max-w-[86%] rounded-[20px] rounded-bl-[7px] border border-[#e0e3e8] bg-white px-5 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.055)]">
                {content ? (
                    <MarkdownContent
                        content={content}
                    />
                ) : (
                    <div className="flex items-center gap-2 text-sm text-[#7d8593]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#b58d50]" />
                        正在分析财务数据
                    </div>
                )}
            </div>
        </div>
    );
}

function AdvisorWelcome({
                            onSelectQuestion,
                        }: {
    onSelectQuestion: (
        question: string,
    ) => void;
}) {
    return (
        <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#09152f] text-[#dec79f] shadow-[0_18px_45px_rgba(9,21,47,0.2)]">
                <Sparkles size={27} />
            </div>

            <p className="mt-6 text-xl font-semibold text-[#273147]">
                有什么财务问题需要分析？
            </p>

            <p className="mt-3 max-w-xl text-sm leading-7 text-[#7d8593]">
                我会结合你的真实账单、预算使用情况和消费偏好，提供更具体的财务分析与节省建议。
            </p>

            <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                {suggestedQuestions.map(
                    (question) => (
                        <button
                            key={question}
                            type="button"
                            onClick={() =>
                                onSelectQuestion(question)
                            }
                            className="rounded-[17px] border border-[#e0e3e8] bg-white px-5 py-4 text-left text-sm leading-6 text-[#596273] transition hover:-translate-y-0.5 hover:border-[#d0b98e] hover:bg-[#fbf7ef]"
                        >
                            {question}
                        </button>
                    ),
                )}
            </div>
        </div>
    );
}


interface MessageAvatarProps {
    icon: ReactNode;
    className: string;
}

function MessageAvatar({
                           icon,
                           className,
                       }: MessageAvatarProps) {
    return (
        <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${className}`}
        >
            {icon}
        </div>
    );
}

function createConversationTitle(
    message: string,
): string {
    const normalized = message
        .replace(/\s+/g, " ")
        .trim();

    if (normalized.length <= 28) {
        return normalized;
    }

    return `${normalized.slice(0, 28)}…`;
}

function formatConversationTime(
    value: string,
): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "zh-CN",
        {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        },
    ).format(date);
}