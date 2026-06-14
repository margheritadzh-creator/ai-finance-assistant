"use client";

import {
  useCallback,
  useEffect,
  useState,
  } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
    BarChart3,
  BrainCircuit,
  CircleDollarSign,
  LoaderCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { MonthlyTrendChart } from "@/components/monthly-trend-chart";
import { apiRequest, ApiError } from "@/lib/api";
import {
    clearAuth,
    getAccessToken,
} from "@/lib/auth-storage";
import {
    formatCurrency,
    formatMonth,
    formatPercentage,
    formatRatio,
    formatScore,
    toNumber,
} from "@/lib/format";
import type { AnalyticsOverview } from "@/types/analytics";
import type { CurrentUser } from "@/types/auth";
import {
    FinanceHeader,
} from "@/components/finance-header";

export default function DashboardPage() {
    const router = useRouter();

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [overview, setOverview] =
        useState<AnalyticsOverview | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const loadDashboard = useCallback(
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
                const [currentUser, analytics] =
                    await Promise.all([
                        apiRequest<CurrentUser>(
                            "/api/auth/me",
                        ),
                        apiRequest<AnalyticsOverview>(
                            "/api/analytics/overview",
                        ),
                    ]);

                setUser(currentUser);
                setOverview(analytics);
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
                        : "加载财务数据失败",
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
            void loadDashboard();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [loadDashboard]);

if (loading) {
        return <DashboardLoading />;
    }

    if (!user || !overview) {
        return (
            <DashboardError
                message={
                    errorMessage || "暂时无法加载财务数据"
                }
                onRetry={() => void loadDashboard()}
            />
        );
    }

    const { summary, budget } = overview;

    const categoryStatistics =
        overview.categoryStatistics.slice(0, 5);

    const budgetStatus =
        translateBudgetStatus(budget.status);

    const healthDescription =
        summary.financialHealthScore === null
            ? "尚未生成财务健康评分"
            : getHealthDescription(
                summary.financialHealthScore,
            );

    return (
        <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
            <div className="mx-auto max-w-[1380px]">
                <FinanceHeader
                    displayName={user.displayName}
                    email={user.email}
                    refreshing={refreshing}
                    onRefresh={() => {
                        void loadDashboard(true);
                    }}
                />

                {errorMessage && (
                    <div className="mt-5 flex items-center gap-3 rounded-[16px] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
                        <TriangleAlert size={17} />
                        {errorMessage}
                    </div>
                )}

                <section className="mt-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#9b733a]">
                            财务总览
                        </p>

                        <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.045em] text-[#111827]">
                            {getGreeting()}，{user.displayName}
                        </h1>

                        <p className="mt-3 text-[15px] text-[#747d8d]">
                            当前展示的是
                            {formatMonth(summary.month)}
                            的个人财务数据。
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-[#ded4c2] bg-white/65 px-4 py-2 text-xs text-[#79613d]">
                        <ShieldCheck size={14} />
                        数据已安全同步
                    </div>
                </section>

                <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <OverviewCard
                        icon={<CircleDollarSign size={20} />}
                        iconClassName="bg-[#f4ead8] text-[#9b733a]"
                        title="本月支出"
                        value={formatCurrency(
                            summary.totalSpent,
                        )}
                        description={
                            summary.expenseCount > 0
                                ? `共记录${summary.expenseCount}笔消费`
                                : "等待添加第一笔账单"
                        }
                        indicator="本月"
                    />

                    <OverviewCard
                        icon={<BarChart3 size={20} />}
                        iconClassName="bg-[#e9eef8] text-[#34548a]"
                        title="预算使用"
                        value={formatRatio(
                            summary.budgetUsageRatio,
                        )}
                        description={
                            summary.totalBudget > 0
                                ? `剩余${formatCurrency(
                                    summary.remainingBudget,
                                )}`
                                : "尚未设置本月预算"
                        }
                        indicator={budgetStatus}
                    />

                    <OverviewCard
                        icon={<ShieldCheck size={20} />}
                        iconClassName="bg-[#eceef2] text-[#566174]"
                        title="财务健康度"
                        value={formatScore(
                            summary.financialHealthScore,
                        )}
                        description={healthDescription}
                        indicator="评分"
                    />

                    <OverviewCard
                        icon={<BrainCircuit size={20} />}
                        iconClassName="bg-[#efe8f5] text-[#735589]"
                        title="下月支出预测"
                        value={
                            summary.nextMonthPrediction === null
                                ? "--"
                                : formatCurrency(
                                    summary.nextMonthPrediction,
                                )
                        }
                        description={
                            summary.nextMonthPrediction === null
                                ? "需要更多历史支出数据"
                                : "根据历史消费趋势计算"
                        }
                        indicator="预测"
                    />
                </section>

                <section className="mt-5 grid gap-5 xl:grid-cols-[1.48fr_0.82fr]">
                    <article className="finance-surface overflow-hidden rounded-[25px] p-6 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[#273147]">
                                    支出趋势
                                </p>

                                <p className="mt-1 text-xs text-[#9299a5]">
                                    最近六个月月度消费变化
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:items-end">
                                <div className="rounded-[14px] bg-[#f7f3ea] px-4 py-2 text-right">
                                    <p className="text-[10px] text-[#9a8260]">
                                        本月累计支出
                                    </p>

                                    <p className="mt-1 text-lg font-semibold text-[#182238]">
                                        {formatCurrency(
                                            summary.totalSpent,
                                        )}
                                    </p>
                                </div>

                                <Link
                                    href="/analytics"
                                    className="finance-secondary-button"
                                >
                                    <BarChart3 size={15} />
                                    查看详细分析
                                </Link>
                            </div>
                        </div>

                        <div className="mt-5 h-[290px] rounded-[19px] border border-[#e8e9ed] bg-[linear-gradient(180deg,#fbfaf7_0%,#f7f7f8_100%)] px-3 py-4">
                            <MonthlyTrendChart
                                data={overview.monthlyTrend}
                            />
                        </div>
                    </article>

                    <article className="finance-surface rounded-[25px] p-6 sm:p-7">
                        <div>
                            <p className="text-sm font-semibold text-[#273147]">
                                消费分类
                            </p>

                            <p className="mt-1 text-xs text-[#9299a5]">
                                本月各类消费所占比例
                            </p>
                        </div>

                        {categoryStatistics.length === 0 ? (
                            <div className="flex min-h-[290px] flex-col items-center justify-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f3f6] text-[#697386]">
                                    <ReceiptText size={21} />
                                </div>

                                <p className="mt-4 text-sm font-medium text-[#3e485b]">
                                    暂无分类数据
                                </p>

                                <p className="mt-2 text-xs leading-5 text-[#939aa6]">
                                    添加账单后会自动统计消费结构
                                </p>
                            </div>
                        ) : (
                            <div className="mt-7 space-y-5">
                                {categoryStatistics.map(
                                    (category) => (
                                        <div key={category.categoryId}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-[#344054]">
                                                        {category.categoryName}
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-[#9299a5]">
                                                        {category.expenseCount}
                                                        笔消费
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-[#253047]">
                                                        {formatCurrency(
                                                            category.amount,
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-[#9b733a]">
                                                        {formatPercentage(
                                                            category.percentage,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eceef2]">
                                                <div
                                                    className="h-full rounded-full bg-[linear-gradient(90deg,#c7a66c,#a97b3e)]"
                                                    style={{
                                                        width: `${Math.min(
                                                            Math.max(
                                                                toNumber(
                                                                    category.percentage,
                                                                ),
                                                                2,
                                                            ),
                                                            100,
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </article>
                </section>

                <section className="mt-5 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
                    <article className="finance-surface rounded-[25px] p-6 sm:p-7">
                        <p className="text-sm font-semibold text-[#273147]">
                            本月预算
                        </p>

                        <div className="mt-6 flex items-end justify-between gap-5">
                            <div>
                                <p className="text-xs text-[#9299a5]">
                                    预算总额
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-[#172033]">
                                    {formatCurrency(
                                        budget.totalBudget,
                                    )}
                                </p>
                            </div>

                            <span className="rounded-full bg-[#f4ead8] px-3 py-1.5 text-xs font-medium text-[#8a642f]">
                {budgetStatus}
              </span>
                        </div>

                        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e9ebef]">
                            <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#c7a66c,#9b733a)]"
                                style={{
                                    width: `${Math.min(
                                        toNumber(budget.usageRatio) *
                                        100,
                                        100,
                                    )}%`,
                                }}
                            />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-4">
                            <BudgetNumber
                                title="已经使用"
                                value={formatCurrency(
                                    budget.totalSpent,
                                )}
                            />

                            <BudgetNumber
                                title="剩余预算"
                                value={formatCurrency(
                                    budget.remainingBudget,
                                )}
                            />
                        </div>
                    </article>

                    <article className="relative overflow-hidden rounded-[25px] border border-white/10 bg-[linear-gradient(145deg,#071126_0%,#102445_58%,#0d1d38_100%)] p-7 text-white shadow-[0_22px_60px_rgba(9,21,47,0.22)]">
                        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#c4a36a]/18 blur-3xl" />

                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#c4a36a]/30 bg-[#c4a36a]/12 text-[#dec79f]">
                                    <Sparkles size={20} />
                                </div>

                                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] tracking-[0.1em] text-white/60">
                  智能分析
                </span>
                            </div>

                            <p className="mt-7 text-sm font-medium text-[#dec79f]">
                                智能财务顾问
                            </p>

                            <h2 className="mt-4 text-[27px] font-semibold leading-[1.35] tracking-[-0.035em]">
                                从真实账单中，
                                <br />
                                找到更合适的消费方式。
                            </h2>

                            <p className="mt-5 max-w-xl text-sm leading-6 text-white/55">
                                系统会结合消费结构、预算使用情况和异常账单，
                                提供符合个人消费习惯的财务建议。
                            </p>

                            <div className="mt-7 grid gap-3 sm:grid-cols-3">
                                <AdvisorMetric
                                    title="日均支出"
                                    value={formatCurrency(
                                        summary.dailyAverage,
                                    )}
                                />

                                <AdvisorMetric
                                    title="主要分类"
                                    value={
                                        summary.topCategoryName ??
                                        "暂无数据"
                                    }
                                />

                                <AdvisorMetric
                                    title="异常记录"
                                    value={`${summary.anomalyCount}笔`}
                                />
                            </div>
                        </div>
                    </article>
                </section>
            </div>
        </main>
    );
}

interface OverviewCardProps {
    icon: ReactNode;
    iconClassName: string;
    title: string;
    value: string;
    description: string;
    indicator: string;
}

function OverviewCard({
                          icon,
                          iconClassName,
                          title,
                          value,
                          description,
                          indicator,
                      }: OverviewCardProps) {
    return (
        <article className="finance-surface group relative overflow-hidden rounded-[22px] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.09)]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,#c4a36a,transparent)] opacity-65" />

            <div className="flex items-start justify-between">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${iconClassName}`}
                >
                    {icon}
                </div>

                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[10px] font-semibold text-[#858d9a]">
          {indicator}
        </span>
            </div>

            <p className="mt-5 text-sm text-[#737d8d]">
                {title}
            </p>

            <p className="mt-2 text-[26px] font-semibold tracking-[-0.035em] text-[#172033]">
                {value}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#969da8]">
                {description}
            </p>
        </article>
    );
}

interface BudgetNumberProps {
    title: string;
    value: string;
}

function BudgetNumber({
                          title,
                          value,
                      }: BudgetNumberProps) {
    return (
        <div className="rounded-[16px] bg-[#f6f7f8] p-4">
            <p className="text-[11px] text-[#9299a5]">
                {title}
            </p>

            <p className="mt-2 text-sm font-semibold text-[#344054]">
                {value}
            </p>
        </div>
    );
}

interface AdvisorMetricProps {
    title: string;
    value: string;
}

function AdvisorMetric({
                           title,
                           value,
                       }: AdvisorMetricProps) {
    return (
        <div className="rounded-[16px] border border-white/10 bg-white/[0.055] p-4">
            <p className="text-[11px] text-white/42">
                {title}
            </p>

            <p className="mt-2 truncate text-sm font-medium text-white/85">
                {value}
            </p>
        </div>
    );
}

function DashboardLoading() {
    return (
        <main className="flex min-h-screen items-center justify-center">
            <div className="flex items-center gap-3 text-[#344054]">
                <LoaderCircle
                    className="animate-spin text-[#9b733a]"
                    size={21}
                />
                正在加载财务数据
            </div>
        </main>
    );
}

interface DashboardErrorProps {
    message: string;
    onRetry: () => void;
}

function DashboardError({
                            message,
                            onRetry,
                        }: DashboardErrorProps) {
    return (
        <main className="flex min-h-screen items-center justify-center p-6">
            <div className="finance-surface max-w-md rounded-[24px] p-8 text-center">
                <TriangleAlert
                    size={28}
                    className="mx-auto text-amber-600"
                />

                <p className="mt-4 text-[#4a5568]">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-5 rounded-[13px] bg-[#09152f] px-5 py-3 text-sm font-medium text-white"
                >
                    重新加载
                </button>
            </div>
        </main>
    );
}

function getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 6) {
        return "夜深了";
    }

    if (hour < 11) {
        return "上午好";
    }

    if (hour < 14) {
        return "中午好";
    }

    if (hour < 18) {
        return "下午好";
    }

    return "晚上好";
}

function translateBudgetStatus(
    status: string,
): string {
    switch (status) {
        case "NORMAL":
            return "预算正常";

        case "ALERT":
            return "接近预算";

        case "OVER_BUDGET":
            return "已经超支";

        case "NO_BUDGET":
        default:
            return "未设预算";
    }
}

function getHealthDescription(
    score: number,
): string {
    if (score >= 85) {
        return "财务状况表现优秀";
    }

    if (score >= 70) {
        return "财务状况整体良好";
    }

    if (score >= 55) {
        return "部分消费需要关注";
    }

    return "建议尽快调整消费计划";
}