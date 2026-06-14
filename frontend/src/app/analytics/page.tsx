"use client";

import Link from "next/link";
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
  BarChart3,
  BrainCircuit,
  CalendarRange,
  CircleDollarSign,
  LoaderCircle,
  MessageCircle,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
    CategoryDonutChart,
} from "@/components/category-donut-chart";
import {
    MonthlyComparisonChart,
} from "@/components/monthly-comparison-chart";
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
    formatMonth,
    formatRatio,
    formatScore,
    toNumber,
} from "@/lib/format";
import type {
    AnalyticsOverview,
    MonthlyTrend,
} from "@/types/analytics";
import type {
    CurrentUser,
} from "@/types/auth";
import {
    FinanceHeader,
} from "@/components/finance-header";

export default function AnalyticsPage() {
    const router = useRouter();

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [overview, setOverview] =
        useState<AnalyticsOverview | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const loadPage = useCallback(
        async (refresh = false) => {
            const token = getAccessToken();

            if (!token) {
                router.replace("/login");
                return;
            }

            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setErrorMessage("");

            try {
                const [
                    currentUser,
                    analyticsOverview,
                ] = await Promise.all([
                    apiRequest<CurrentUser>(
                        "/api/auth/me",
                    ),

                    apiRequest<AnalyticsOverview>(
                        "/api/analytics/overview",
                    ),
                ]);

                setUser(currentUser);
                setOverview(analyticsOverview);
            } catch (error) {
                if (
                    error instanceof ApiError &&
                    error.status === 401
                ) {
                    clearAuth();
                    router.replace("/login");
                    return;
                }

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "财务分析加载失败。",
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [router],
    );

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            void loadPage();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [loadPage]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="flex items-center gap-3 text-[#344054]">
                    <LoaderCircle
                        size={21}
                        className="animate-spin text-[#9b733a]"
                    />
                    正在生成财务分析
                </div>
            </main>
        );
    }

    if (!user || !overview) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <div className="finance-surface max-w-md rounded-[24px] p-8 text-center">
                    <AlertTriangle
                        size={28}
                        className="mx-auto text-amber-600"
                    />

                    <p className="mt-4 text-[#4a5568]">
                        {errorMessage ||
                            "暂时无法加载财务分析"}
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

    const {
        summary,
        budget,
        categoryStatistics,
        monthlyTrend,
    } = overview;

    const averageMonthlyExpense =
        calculateMonthlyAverage(monthlyTrend);

    const trendResult =
        calculateTrend(monthlyTrend);

    const topCategory =
        categoryStatistics[0] ?? null;

    return (
        <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
            <div className="mx-auto max-w-[1480px]">
                <FinanceHeader
                    displayName={user.displayName}
                    email={user.email}
                    refreshing={refreshing}
                    onRefresh={() => {
                        void loadPage(true);
                    }}
                />

                <section className="mt-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#9b733a]">
                            财务数据分析
                        </p>

                        <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.045em] text-[#111827]">
                            多维财务分析报告
                        </h1>

                        <p className="mt-3 text-[15px] text-[#747d8d]">
                            当前分析周期：
                            {formatMonth(summary.month)}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-[#ded4c2] bg-white/65 px-4 py-2 text-xs text-[#79613d]">
                        <ShieldCheck size={14} />
                        已同步最新账单和预算数据
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

                <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard
                        icon={<CircleDollarSign size={20} />}
                        title="本月支出"
                        value={formatCurrency(
                            summary.totalSpent,
                        )}
                        description={`${summary.expenseCount}笔消费记录`}
                    />

                    <MetricCard
                        icon={<CalendarRange size={20} />}
                        title="月均支出"
                        value={formatCurrency(
                            averageMonthlyExpense,
                        )}
                        description="按照已有月度记录计算"
                    />

                    <MetricCard
                        icon={<WalletCards size={20} />}
                        title="预算使用率"
                        value={formatRatio(
                            budget.usageRatio,
                        )}
                        description={
                            budget.totalBudget > 0
                                ? `剩余${formatCurrency(
                                    budget.remainingBudget,
                                )}`
                                : "本月尚未设置预算"
                        }
                    />

                    <MetricCard
                        icon={<ShieldCheck size={20} />}
                        title="财务健康度"
                        value={formatScore(
                            summary.financialHealthScore,
                        )}
                        description={getHealthText(
                            summary.financialHealthScore,
                        )}
                    />

                    <MetricCard
                        icon={<BrainCircuit size={20} />}
                        title="下月预测"
                        value={
                            summary.nextMonthPrediction ===
                            null
                                ? "--"
                                : formatCurrency(
                                    summary.nextMonthPrediction,
                                )
                        }
                        description="根据历史消费趋势生成"
                    />
                </section>

                <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <article className="finance-surface rounded-[25px] p-6 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="font-semibold text-[#273147]">
                                    月度支出变化
                                </p>

                                <p className="mt-1 text-xs text-[#9299a5]">
                                    最近六个月的实际消费金额
                                </p>
                            </div>

                            <TrendBadge
                                direction={trendResult.direction}
                                text={trendResult.text}
                            />
                        </div>

                        <div className="mt-5 rounded-[19px] border border-[#e7e9ed] bg-[#fbfaf7] px-3 py-5">
                            <MonthlyComparisonChart
                                data={monthlyTrend}
                            />
                        </div>
                    </article>

                    <article className="finance-surface rounded-[25px] p-6 sm:p-7">
                        <div>
                            <p className="font-semibold text-[#273147]">
                                核心分析结论
                            </p>

                            <p className="mt-1 text-xs text-[#9299a5]">
                                根据当前账单和预算自动整理
                            </p>
                        </div>

                        <div className="mt-6 space-y-4">
                            <InsightCard
                                title="主要消费分类"
                                content={
                                    topCategory
                                        ? `${topCategory.categoryName}是本月支出最高的类别，共支出${formatCurrency(
                                            topCategory.amount,
                                        )}。`
                                        : "当前没有足够的分类数据。"
                                }
                            />

                            <InsightCard
                                title="预算执行情况"
                                content={getBudgetInsight(
                                    budget.totalBudget,
                                    budget.usageRatio,
                                    budget.remainingBudget,
                                )}
                            />

                            <InsightCard
                                title="消费记录完整度"
                                content={
                                    summary.expenseCount >= 20
                                        ? `本月已记录${summary.expenseCount}笔消费，数据较为完整。`
                                        : `本月目前记录${summary.expenseCount}笔消费，继续记录可提高分析准确度。`
                                }
                            />

                            <InsightCard
                                title="异常账单"
                                content={
                                    summary.anomalyCount > 0
                                        ? `系统发现${summary.anomalyCount}笔异常金额记录，建议再次检查。`
                                        : "当前没有发现需要特别关注的异常金额。"
                                }
                            />
                        </div>
                    </article>
                </section>

                <section className="finance-surface mt-5 rounded-[25px] p-6 sm:p-7">
                    <div>
                        <p className="font-semibold text-[#273147]">
                            消费结构分析
                        </p>

                        <p className="mt-1 text-xs text-[#9299a5]">
                            展示本月不同分类的支出金额与比例
                        </p>
                    </div>

                    <div className="mt-6 rounded-[20px] border border-[#e7e9ed] bg-[#fbfaf7] p-5 sm:p-7">
                        <CategoryDonutChart
                            data={categoryStatistics}
                        />
                    </div>
                </section>

                <section className="mt-5 grid gap-5 lg:grid-cols-3">
                    <AnalysisAction
                        icon={<ReceiptText size={21} />}
                        title="完善消费记录"
                        description="继续添加日常账单，让趋势分析和预测更加准确。"
                        href="/expenses"
                        buttonText="管理账单"
                    />

                    <AnalysisAction
                        icon={<PiggyBank size={21} />}
                        title="生成节省计划"
                        description="结合当前消费结构，生成可以实际执行的省钱建议。"
                        href="/advice"
                        buttonText="查看建议"
                    />

                    <AnalysisAction
                        icon={<MessageCircle size={21} />}
                        title="进一步咨询"
                        description="向智能财务顾问询问预算、消费习惯和财务健康问题。"
                        href="/advisor"
                        buttonText="开始咨询"
                    />
                </section>
            </div>
        </main>
    );
}

interface MetricCardProps {
    icon: ReactNode;
    title: string;
    value: string;
    description: string;
}

function MetricCard({
                        icon,
                        title,
                        value,
                        description,
                    }: MetricCardProps) {
    return (
        <article className="finance-surface rounded-[21px] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f4ead8] text-[#9b733a]">
                {icon}
            </div>

            <p className="mt-5 text-sm text-[#737d8d]">
                {title}
            </p>

            <p className="mt-2 text-[24px] font-semibold tracking-[-0.035em] text-[#172033]">
                {value}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#969da8]">
                {description}
            </p>
        </article>
    );
}

interface TrendBadgeProps {
    direction: "UP" | "DOWN" | "FLAT";
    text: string;
}

function TrendBadge({
                        direction,
                        text,
                    }: TrendBadgeProps) {
    if (direction === "UP") {
        return (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
        <TrendingUp size={14} />
                {text}
      </span>
        );
    }

    if (direction === "DOWN") {
        return (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2f0] px-3 py-1.5 text-xs font-medium text-[#586a60]">
        <TrendingDown size={14} />
                {text}
      </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eef1f5] px-3 py-1.5 text-xs font-medium text-[#657080]">
      <BarChart3 size={14} />
            {text}
    </span>
    );
}

interface InsightCardProps {
    title: string;
    content: string;
}

function InsightCard({
                         title,
                         content,
                     }: InsightCardProps) {
    return (
        <div className="rounded-[17px] border border-[#e4e6ea] bg-[#fbfaf7] p-4">
            <p className="text-sm font-semibold text-[#344054]">
                {title}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#788190]">
                {content}
            </p>
        </div>
    );
}

interface AnalysisActionProps {
    icon: ReactNode;
    title: string;
    description: string;
    href: string;
    buttonText: string;
}

function AnalysisAction({
                            icon,
                            title,
                            description,
                            href,
                            buttonText,
                        }: AnalysisActionProps) {
    return (
        <article className="finance-surface rounded-[22px] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#09152f] text-[#dec79f]">
                {icon}
            </div>

            <p className="mt-5 font-semibold text-[#273147]">
                {title}
            </p>

            <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#818997]">
                {description}
            </p>

            <Link
                href={href}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-[12px] border border-[#d9c9ad] bg-[#f8f1e5] px-4 text-sm font-medium text-[#80602f] transition hover:bg-[#f2e6d1]"
            >
                {buttonText}
            </Link>
        </article>
    );
}

function calculateMonthlyAverage(
    data: MonthlyTrend[],
): number {
    const validMonths = data.filter(
        (item) => toNumber(item.amount) > 0,
    );

    if (validMonths.length === 0) {
        return 0;
    }

    const total = validMonths.reduce(
        (sum, item) =>
            sum + toNumber(item.amount),
        0,
    );

    return total / validMonths.length;
}

function calculateTrend(
    data: MonthlyTrend[],
): {
    direction: "UP" | "DOWN" | "FLAT";
    text: string;
} {
    const validData = data.filter(
        (item) => toNumber(item.amount) > 0,
    );

    if (validData.length < 2) {
        return {
            direction: "FLAT",
            text: "数据仍在积累",
        };
    }

    const previous = toNumber(
        validData[
        validData.length - 2
            ].amount,
    );

    const current = toNumber(
        validData[
        validData.length - 1
            ].amount,
    );

    if (previous <= 0) {
        return {
            direction: "FLAT",
            text: "暂无可比月份",
        };
    }

    const percentage =
        ((current - previous) / previous) *
        100;

    if (Math.abs(percentage) < 1) {
        return {
            direction: "FLAT",
            text: "与上月基本持平",
        };
    }

    if (percentage > 0) {
        return {
            direction: "UP",
            text: `较上月增加${Math.abs(
                percentage,
            ).toFixed(1)}%`,
        };
    }

    return {
        direction: "DOWN",
        text: `较上月减少${Math.abs(
            percentage,
        ).toFixed(1)}%`,
    };
}

function getHealthText(
    score: number | null,
): string {
    if (score === null) {
        return "需要更多消费数据";
    }

    if (score >= 85) {
        return "财务状态表现优秀";
    }

    if (score >= 70) {
        return "财务状态整体良好";
    }

    if (score >= 55) {
        return "部分支出需要关注";
    }

    return "建议调整消费计划";
}

function getBudgetInsight(
    totalBudget: number,
    usageRatio: number,
    remainingBudget: number,
): string {
    if (toNumber(totalBudget) <= 0) {
        return "当前月份还没有设置预算，建议先建立整月总预算。";
    }

    const ratio = toNumber(usageRatio);

    if (ratio > 1) {
        return `本月预算已经超支，当前超出约${formatCurrency(
            Math.abs(toNumber(remainingBudget)),
        )}。`;
    }

    if (ratio >= 0.8) {
        return `预算已使用${formatRatio(
            ratio,
        )}，剩余空间较少。`;
    }

    return `预算已使用${formatRatio(
        ratio,
    )}，目前仍剩余${formatCurrency(
        remainingBudget,
    )}。`;
}
