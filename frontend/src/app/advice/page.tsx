"use client";

import {
  useRouter } from "next/navigation";
import {
    type ReactNode,
  useCallback,
  useEffect,
  useState,
  } from "react";

import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    LoaderCircle,
    PiggyBank,
    RefreshCw,
    RotateCcw,
    Sparkles,
    Target,
    XCircle,
} from "lucide-react";

import { MarkdownContent } from "@/components/markdown-content";
import {
    apiRequest,
    ApiError,
} from "@/lib/api";
import {
    clearAuth,
    getAccessToken,
} from "@/lib/auth-storage";
import {
    formatCurrency,
    formatDateTime,
    formatMonth,
} from "@/lib/format";
import type {
    SavingAdvice,
    SavingAdviceStatus,
} from "@/types/advice";
import type { CurrentUser } from "@/types/auth";
import {
    FinanceHeader,
} from "@/components/finance-header";


export default function AdvicePage() {
    const router = useRouter();

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [selectedMonth, setSelectedMonth] =
        useState(currentMonthValue());

    const [adviceList, setAdviceList] =
        useState<SavingAdvice[]>([]);

    const [
        selectedAdviceId,
        setSelectedAdviceId,
    ] = useState<number | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [generating, setGenerating] =
        useState(false);

    const [
        statusUpdating,
        setStatusUpdating,
    ] = useState<{
        adviceId: number;
        status: SavingAdviceStatus;
    } | null>(null);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const loadPage = useCallback(async () => {
        const token = getAccessToken();

        if (!token) {
            router.replace("/login");
            return;
        }

        setLoading(true);
        setErrorMessage("");

        const month = currentMonthValue();

        try {
            const [
                currentUser,
                adviceHistory,
            ] = await Promise.all([
                apiRequest<CurrentUser>(
                    "/api/auth/me",
                ),

                apiRequest<SavingAdvice[]>(
                    `/api/ai/advisor/advice?month=${month}-01`,
                ),
            ]);

            setUser(currentUser);
            setSelectedMonth(month);
            setAdviceList(adviceHistory);

            setSelectedAdviceId(
                adviceHistory[0]?.id ?? null,
            );
        } catch (error) {
            if (isUnauthorized(error)) {
                clearAuth();
                router.replace("/login");
                return;
            }

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "省钱建议加载失败。",
            );
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            void loadPage();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [loadPage]);

    async function loadHistory(
        month: string,
    ) {
        if (!month) {
            return;
        }

        setHistoryLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response =
                await apiRequest<SavingAdvice[]>(
                    `/api/ai/advisor/advice?month=${month}-01`,
                );

            setAdviceList(response);
            setSelectedAdviceId(
                response[0]?.id ?? null,
            );
        } catch (error) {
            if (isUnauthorized(error)) {
                clearAuth();
                router.replace("/login");
                return;
            }

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "建议历史加载失败。",
            );
        } finally {
            setHistoryLoading(false);
        }
    }

    async function generateAdvice() {
        if (!selectedMonth || generating) {
            return;
        }

        setGenerating(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response =
                await apiRequest<SavingAdvice>(
                    `/api/ai/advisor/advice?month=${selectedMonth}-01`,
                    {
                        method: "POST",
                    },
                );

            setAdviceList((current) => [
                response,
                ...current.filter(
                    (advice) =>
                        advice.id !== response.id,
                ),
            ]);

            setSelectedAdviceId(response.id);

            setSuccessMessage(
                "新的个性化省钱建议已经生成。",
            );
        } catch (error) {
            if (isUnauthorized(error)) {
                clearAuth();
                router.replace("/login");
                return;
            }

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "生成省钱建议失败。",
            );
        } finally {
            setGenerating(false);
        }
    }

    async function updateAdviceStatus(
        advice: SavingAdvice,
        nextStatus: SavingAdviceStatus,
    ) {
        if (
            statusUpdating ||
            advice.status === nextStatus
        ) {
            return;
        }

        if (
            nextStatus === "DISMISSED" &&
            !window.confirm(
                "确定要忽略这条省钱建议吗？之后仍然可以恢复为待处理。",
            )
        ) {
            return;
        }

        setStatusUpdating({
            adviceId: advice.id,
            status: nextStatus,
        });

        setErrorMessage("");
        setSuccessMessage("");

        try {
            const updatedAdvice =
                await apiRequest<SavingAdvice>(
                    `/api/ai/advisor/advice/${advice.id}/status?status=${nextStatus}`,
                    {
                        method: "PATCH",
                    },
                );

            setAdviceList((current) =>
                current.map((item) =>
                    item.id === updatedAdvice.id
                        ? updatedAdvice
                        : item,
                ),
            );

            setSuccessMessage(
                `建议状态已更新为“${translateStatus(
                    updatedAdvice.status,
                )}”。`,
            );
        } catch (error) {
            if (isUnauthorized(error)) {
                clearAuth();
                router.replace("/login");
                return;
            }

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "建议状态更新失败。",
            );
        } finally {
            setStatusUpdating(null);
        }
    }

    const selectedAdvice =
        adviceList.find(
            (advice) =>
                advice.id === selectedAdviceId,
        ) ?? null;

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="flex items-center gap-3 text-[#344054]">
                    <LoaderCircle
                        size={21}
                        className="animate-spin text-[#9b733a]"
                    />
                    正在加载省钱建议
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
                            "暂时无法加载省钱建议"}
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
                />

                <section className="mt-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#9b733a]">
                            智能省钱建议
                        </p>

                        <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.045em] text-[#111827]">
                            个性化节省计划
                        </h1>

                        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#747d8d]">
                            根据真实消费记录、预算状态和个人偏好，生成可以实际执行的省钱建议。
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="block">
              <span className="sr-only">
                选择月份
              </span>

                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(event) => {
                                    const month =
                                        event.target.value;

                                    setSelectedMonth(month);
                                    void loadHistory(month);
                                }}
                                disabled={
                                    historyLoading ||
                                    generating
                                }
                                className="finance-input min-w-[190px]"
                            />
                        </label>

                        <button
                            type="button"
                            onClick={() =>
                                void loadHistory(selectedMonth)
                            }
                            disabled={
                                historyLoading ||
                                generating
                            }
                            className="finance-secondary-button"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    historyLoading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            刷新历史
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void generateAdvice()
                            }
                            disabled={generating}
                            className="finance-primary-button sm:w-auto sm:min-w-[180px]"
                        >
                            {generating ? (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Sparkles size={17} />
                            )}

                            {generating
                                ? "分析中..."
                                : "生成本月优化方案"}
                        </button>
                    </div>
                </section>

                {errorMessage && (
                    <div className="mt-5 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle
                            size={17}
                            className="mt-0.5 shrink-0"
                        />
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="mt-5 flex items-center gap-3 rounded-[16px] border border-[#d9c9ad] bg-[#faf4e9] px-4 py-3 text-sm text-[#7c5c2c]">
                        <Sparkles size={17} />
                        {successMessage}
                    </div>
                )}

                <section className="mt-7 grid min-h-[670px] gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
                    <aside className="finance-surface overflow-hidden rounded-[25px]">
                        <div className="border-b border-[#e6e8ec] px-5 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f4ead8] text-[#9b733a]">
                                    <PiggyBank size={20} />
                                </div>

                                <div>
                                    <p className="font-semibold text-[#273147]">
                                        建议历史
                                    </p>

                                    <p className="mt-1 text-xs text-[#9299a5]">
                                        {formatMonth(
                                            selectedMonth,
                                        )}
                                        共{adviceList.length}条
                                    </p>
                                </div>
                            </div>
                        </div>

                        {historyLoading ? (
                            <div className="flex min-h-[400px] items-center justify-center gap-3 text-sm text-[#697386]">
                                <LoaderCircle
                                    size={18}
                                    className="animate-spin text-[#9b733a]"
                                />
                                正在加载
                            </div>
                        ) : adviceList.length === 0 ? (
                            <div className="flex min-h-[440px] flex-col items-center justify-center px-6 text-center">
                                <PiggyBank
                                    size={30}
                                    className="text-[#b6bbc4]"
                                />

                                <p className="mt-4 text-sm font-medium text-[#596273]">
                                    当前月份还没有建议
                                </p>

                                <p className="mt-2 text-xs leading-5 text-[#9299a5]">
                                    点击“生成本月建议”，系统会分析当前账单与预算。
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[610px] space-y-2 overflow-y-auto p-3">
                                {adviceList.map((advice) => {
                                    const active =
                                        advice.id ===
                                        selectedAdviceId;

                                    return (
                                        <button
                                            key={advice.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedAdviceId(
                                                    advice.id,
                                                )
                                            }
                                            className={[
                                                "w-full rounded-[16px] border p-4 text-left transition",
                                                active
                                                    ? "border-[#d5bd91] bg-[#f8f1e5]"
                                                    : "border-transparent hover:border-[#e1e4e8] hover:bg-[#f8f8f7]",
                                            ].join(" ")}
                                        >
                                            <p className="line-clamp-2 text-sm font-semibold leading-6 text-[#344054]">
                                                {advice.title}
                                            </p>

                                            <div className="mt-3 flex items-center justify-between gap-3">
  <span className="text-[11px] text-[#9299a5]">
    {formatDateTime(
        advice.createdAt,
    )}
  </span>

                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <StatusBadge
                                                        status={advice.status}
                                                    />

                                                    <PriorityBadge
                                                        priority={advice.priority}
                                                    />
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </aside>

                    <article className="finance-surface min-w-0 overflow-hidden rounded-[25px]">
                        {!selectedAdvice ? (
                            <div className="flex min-h-[670px] flex-col items-center justify-center px-6 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#09152f] text-[#dec79f]">
                                    <Sparkles size={27} />
                                </div>

                                <p className="mt-5 text-lg font-semibold text-[#344054]">
                                    生成你的第一份省钱建议
                                </p>

                                <p className="mt-3 max-w-lg text-sm leading-7 text-[#8b93a0]">
                                    系统将根据消费分类、异常金额、月度预算和消费习惯，提供具体可执行的建议。
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="border-b border-[#e6e8ec] px-6 py-6 sm:px-8">
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <PriorityBadge
                                                    priority={
                                                        selectedAdvice.priority
                                                    }
                                                />

                                                <StatusBadge
                                                    status={selectedAdvice.status}
                                                />
                                            </div>

                                            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.025em] text-[#172033]">
                                                {selectedAdvice.title}
                                            </h2>

                                            <p className="mt-2 text-xs text-[#9299a5]">
                                                生成于
                                                {formatDateTime(
                                                    selectedAdvice.createdAt,
                                                )}
                                            </p>
                                        </div>

                                        <div className="grid min-w-[280px] grid-cols-2 gap-3">
                                            <SummaryCard
                                                icon={
                                                    <CalendarDays
                                                        size={17}
                                                    />
                                                }
                                                title="分析月份"
                                                value={formatMonth(
                                                    selectedAdvice.targetMonth,
                                                )}
                                            />

                                            <SummaryCard
                                                icon={
                                                    <Target size={17} />
                                                }
                                                title="预计可节省"
                                                value={
                                                    selectedAdvice
                                                        .expectedSaving ===
                                                    null
                                                        ? "暂未估算"
                                                        : formatCurrency(
                                                            selectedAdvice
                                                                .expectedSaving,
                                                        )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-b border-[#e6e8ec] bg-[#fbfaf7] px-6 py-5 sm:px-8">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-[#344054]">
                                                建议执行状态
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-[#8b93a0]">
                                                根据实际执行情况更新状态，便于持续跟踪省钱计划。
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <StatusActionButton
                                                label="恢复待处理"
                                                icon={<RotateCcw size={15} />}
                                                active={
                                                    selectedAdvice.status ===
                                                    "ACTIVE"
                                                }
                                                loading={
                                                    statusUpdating?.adviceId ===
                                                    selectedAdvice.id &&
                                                    statusUpdating.status ===
                                                    "ACTIVE"
                                                }
                                                disabled={
                                                    statusUpdating !== null
                                                }
                                                tone="active"
                                                onClick={() =>
                                                    void updateAdviceStatus(
                                                        selectedAdvice,
                                                        "ACTIVE",
                                                    )
                                                }
                                            />

                                            <StatusActionButton
                                                label="采纳建议"
                                                icon={<CheckCircle2 size={15} />}
                                                active={
                                                    selectedAdvice.status ===
                                                    "ADOPTED"
                                                }
                                                loading={
                                                    statusUpdating?.adviceId ===
                                                    selectedAdvice.id &&
                                                    statusUpdating.status ===
                                                    "ADOPTED"
                                                }
                                                disabled={
                                                    statusUpdating !== null
                                                }
                                                tone="adopted"
                                                onClick={() =>
                                                    void updateAdviceStatus(
                                                        selectedAdvice,
                                                        "ADOPTED",
                                                    )
                                                }
                                            />

                                            <StatusActionButton
                                                label="忽略建议"
                                                icon={<XCircle size={15} />}
                                                active={
                                                    selectedAdvice.status ===
                                                    "DISMISSED"
                                                }
                                                loading={
                                                    statusUpdating?.adviceId ===
                                                    selectedAdvice.id &&
                                                    statusUpdating.status ===
                                                    "DISMISSED"
                                                }
                                                disabled={
                                                    statusUpdating !== null
                                                }
                                                tone="dismissed"
                                                onClick={() =>
                                                    void updateAdviceStatus(
                                                        selectedAdvice,
                                                        "DISMISSED",
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={[
                                        "max-h-[610px] overflow-y-auto px-6 py-7 transition sm:px-8",
                                        selectedAdvice.status ===
                                        "DISMISSED"
                                            ? "opacity-60"
                                            : "",
                                    ].join(" ")}
                                >
                                    <MarkdownContent
                                        content={
                                            selectedAdvice.contentMarkdown
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </article>
                </section>
            </div>
        </main>
    );
}

interface SummaryCardProps {
    icon: ReactNode;
    title: string;
    value: string;
}

function SummaryCard({
                         icon,
                         title,
                         value,
                     }: SummaryCardProps) {
    return (
        <div className="rounded-[16px] border border-[#e1e4e8] bg-[#f8f8f7] p-4">
            <div className="flex items-center gap-2 text-[#9b733a]">
                {icon}

                <span className="text-[11px]">
          {title}
        </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-[#344054]">
                {value}
            </p>
        </div>
    );
}

function StatusBadge({
                         status,
                     }: {
    status: SavingAdviceStatus;
}) {
    switch (status) {
        case "ADOPTED":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 size={12} />
          已采纳
        </span>
            );

        case "DISMISSED":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1f5] px-3 py-1 text-xs font-medium text-[#707887]">
          <XCircle size={12} />
          已忽略
        </span>
            );

        default:
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          <RefreshCw size={12} />
          待处理
        </span>
            );
    }
}

interface StatusActionButtonProps {
    label: string;
    icon: ReactNode;
    active: boolean;
    loading: boolean;
    disabled: boolean;
    tone:
        | "active"
        | "adopted"
        | "dismissed";
    onClick: () => void;
}

function StatusActionButton({
                                label,
                                icon,
                                active,
                                loading,
                                disabled,
                                tone,
                                onClick,
                            }: StatusActionButtonProps) {
    const toneClass = {
        active:
            active
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-[#dfe3e8] bg-white text-[#657080] hover:border-amber-300 hover:text-amber-700",

        adopted:
            active
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-[#dfe3e8] bg-white text-[#657080] hover:border-emerald-300 hover:text-emerald-700",

        dismissed:
            active
                ? "border-slate-300 bg-slate-100 text-slate-700"
                : "border-[#dfe3e8] bg-white text-[#657080] hover:border-slate-300 hover:text-slate-700",
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || active}
            aria-pressed={active}
            className={[
                "inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border px-4 text-xs font-medium transition",
                toneClass,
                disabled || active
                    ? "cursor-not-allowed"
                    : "",
                disabled && !active
                    ? "opacity-55"
                    : "",
            ].join(" ")}
        >
            {loading ? (
                <LoaderCircle
                    size={15}
                    className="animate-spin"
                />
            ) : (
                icon
            )}

            {active
                ? `${label}（当前）`
                : label}
        </button>
    );
}

function PriorityBadge({
                           priority,
                       }: {
    priority: string;
}) {
    const normalized =
        priority.toUpperCase();

    if (
        normalized === "HIGH" ||
        normalized === "URGENT"
    ) {
        return (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        高优先级
      </span>
        );
    }

    if (normalized === "LOW") {
        return (
            <span className="rounded-full bg-[#eef2f0] px-3 py-1 text-xs font-medium text-[#5e6c66]">
        低优先级
      </span>
        );
    }

    return (
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
      中优先级
    </span>
    );
}

function translateStatus(
    status: SavingAdviceStatus,
): string {
    switch (status) {
        case "ADOPTED":
            return "已采纳";

        case "DISMISSED":
            return "已忽略";

        case "ACTIVE":
        default:
            return "待处理";
    }
}

function currentMonthValue(): string {
    const date = new Date();

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1,
        ).padStart(2, "0"),
    ].join("-");
}

function isUnauthorized(
    error: unknown,
): boolean {
    return (
        error instanceof ApiError &&
        error.status === 401
    );
}