"use client";

import {
  useRouter } from "next/navigation";
import {
    useCallback,
  useEffect,
  useState,
  } from "react";

import {
    ChevronLeft,
  ChevronRight,
  CircleAlert,
  Edit3,
  LoaderCircle,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from "lucide-react";

import { ExpenseFormModal } from "@/components/expense-form-modal";
import { apiRequest, ApiError } from "@/lib/api";
import {
    clearAuth,
    getAccessToken,
} from "@/lib/auth-storage";
import {
    formatCurrency,
    formatDateTime,
} from "@/lib/format";
import type { CurrentUser } from "@/types/auth";
import type {
    ExpenseCategory,
    ExpensePageResponse,
    ExpenseRecord,
} from "@/types/expense";
import {
    FinanceHeader,
} from "@/components/finance-header";

const PAGE_SIZE = 10;

export default function ExpensesPage() {
    const router = useRouter();

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [categories, setCategories] = useState<
        ExpenseCategory[]
    >([]);

    const [pageData, setPageData] =
        useState<ExpensePageResponse | null>(null);

    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [modalOpen, setModalOpen] =
        useState(false);

    const [editingExpense, setEditingExpense] =
        useState<ExpenseRecord | null>(null);

    const loadData = useCallback(
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
                    categoryList,
                    expensePage,
                ] = await Promise.all([
                    apiRequest<CurrentUser>(
                        "/api/auth/me",
                    ),
                    apiRequest<ExpenseCategory[]>(
                        "/api/categories",
                    ),
                    apiRequest<ExpensePageResponse>(
                        `/api/expenses?page=${page}&size=${PAGE_SIZE}`,
                    ),
                ]);

                setUser(currentUser);
                setCategories(categoryList);
                setPageData(expensePage);
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
                        : "加载账单失败",
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, router],
    );

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [loadData]);

    function openCreateModal() {
        setEditingExpense(null);
        setModalOpen(true);
    }

    function openEditModal(
        expense: ExpenseRecord,
    ) {
        setEditingExpense(expense);
        setModalOpen(true);
    }

    async function deleteExpense(
        expense: ExpenseRecord,
    ) {
        const confirmed = window.confirm(
            `确定要删除“${expense.itemName}”这笔账单吗？删除后无法恢复。`,
        );

        if (!confirmed) {
            return;
        }

        setErrorMessage("");

        try {
            await apiRequest<void>(
                `/api/expenses/${expense.id}`,
                {
                    method: "DELETE",
                },
            );

            if (
                pageData &&
                pageData.content.length === 1 &&
                page > 0
            ) {
                setPage((current) => current - 1);
            } else {
                await loadData(true);
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "删除账单失败",
            );
        }
    }

if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="flex items-center gap-3 text-[#344054]">
                    <LoaderCircle
                        size={21}
                        className="animate-spin text-[#9b733a]"
                    />
                    正在加载账单
                </div>
            </main>
        );
    }

    if (!user || !pageData) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <div className="finance-surface max-w-md rounded-[24px] p-8 text-center">
                    <CircleAlert
                        size={28}
                        className="mx-auto text-amber-600"
                    />

                    <p className="mt-4 text-[#4a5568]">
                        {errorMessage || "暂时无法加载账单"}
                    </p>

                    <button
                        type="button"
                        onClick={() => void loadData()}
                        className="mt-5 rounded-[13px] bg-[#09152f] px-5 py-3 text-sm font-medium text-white"
                    >
                        重新加载
                    </button>
                </div>
            </main>
        );
    }

    return (
        <>
            <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
                <div className="mx-auto max-w-[1380px]">
                    <FinanceHeader
                        displayName={user.displayName}
                        email={user.email}
                        refreshing={refreshing}
                        onRefresh={() => {
                            void loadData(true);
                        }}
                    />

                    <section className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.14em] text-[#9b733a]">
                                账单管理
                            </p>

                            <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.045em] text-[#111827]">
                                我的消费记录
                            </h1>

                            <p className="mt-3 text-[15px] text-[#747d8d]">
                                共记录
                                {pageData.totalElements}
                                笔消费，可新增、编辑或删除账单。
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-[linear-gradient(135deg,#09152f,#1a315a)] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(9,21,47,0.2)] transition hover:-translate-y-0.5"
                        >
                            <Plus size={17} />
                            新增账单
                        </button>
                    </section>

                    {errorMessage && (
                        <div className="mt-5 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMessage}
                        </div>
                    )}

                    <section className="finance-surface mt-7 overflow-hidden rounded-[25px]">
                        <div className="flex flex-col gap-4 border-b border-[#e7e8eb] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-semibold text-[#273147]">
                                    账单明细
                                </p>

                                <p className="mt-1 text-xs text-[#9299a5]">
                                    按消费时间从新到旧排列
                                </p>
                            </div>

                            <div className="flex items-center gap-2 rounded-[13px] border border-[#e0e3e8] bg-[#f8f9fa] px-3 py-2 text-xs text-[#7b8492]">
                                <Search size={14} />
                                当前第{pageData.page + 1}页
                            </div>
                        </div>

                        {pageData.content.length === 0 ? (
                            <EmptyExpenses
                                onCreate={openCreateModal}
                            />
                        ) : (
                            <>
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full border-collapse">
                                        <thead>
                                        <tr className="border-b border-[#eceef1] bg-[#f8f8f7] text-left text-xs text-[#858d9a]">
                                            <th className="px-6 py-4 font-medium">
                                                消费项目
                                            </th>
                                            <th className="px-5 py-4 font-medium">
                                                分类
                                            </th>
                                            <th className="px-5 py-4 font-medium">
                                                金额
                                            </th>
                                            <th className="px-5 py-4 font-medium">
                                                消费时间
                                            </th>
                                            <th className="px-5 py-4 font-medium">
                                                状态
                                            </th>
                                            <th className="px-6 py-4 text-right font-medium">
                                                操作
                                            </th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        {pageData.content.map(
                                            (expense) => (
                                                <ExpenseTableRow
                                                    key={expense.id}
                                                    expense={expense}
                                                    onEdit={() =>
                                                        openEditModal(expense)
                                                    }
                                                    onDelete={() =>
                                                        void deleteExpense(
                                                            expense,
                                                        )
                                                    }
                                                />
                                            ),
                                        )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="divide-y divide-[#eceef1] md:hidden">
                                    {pageData.content.map(
                                        (expense) => (
                                            <ExpenseMobileCard
                                                key={expense.id}
                                                expense={expense}
                                                onEdit={() =>
                                                    openEditModal(expense)
                                                }
                                                onDelete={() =>
                                                    void deleteExpense(expense)
                                                }
                                            />
                                        ),
                                    )}
                                </div>

                                <Pagination
                                    pageData={pageData}
                                    onPrevious={() =>
                                        setPage((current) =>
                                            Math.max(current - 1, 0),
                                        )
                                    }
                                    onNext={() =>
                                        setPage(
                                            (current) => current + 1,
                                        )
                                    }
                                />
                            </>
                        )}
                    </section>
                </div>
            </main>

            {modalOpen && (
                <ExpenseFormModal
                    key={
                        editingExpense
                            ? `编辑-${editingExpense.id}`
                            : "新增"
                    }
                    open
                    expense={editingExpense}
                    categories={categories}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingExpense(null);
                    }}
                    onSaved={() => {
                        void loadData(true);
                    }}
                />
            )}
        </>
    );
}

interface ExpenseRowProps {
    expense: ExpenseRecord;
    onEdit: () => void;
    onDelete: () => void;
}

function ExpenseTableRow({
                             expense,
                             onEdit,
                             onDelete,
                         }: ExpenseRowProps) {
    return (
        <tr className="border-b border-[#f0f1f3] transition hover:bg-[#fbfaf7]">
            <td className="px-6 py-4">
                <p className="text-sm font-medium text-[#273147]">
                    {expense.itemName}
                </p>

                <p className="mt-1 text-xs text-[#9299a5]">
                    {expense.merchant || "未填写商家"}
                </p>
            </td>

            <td className="px-5 py-4">
        <span className="rounded-full bg-[#f4ead8] px-3 py-1.5 text-xs font-medium text-[#8a642f]">
          {expense.categoryName}
        </span>
            </td>

            <td className="px-5 py-4 text-sm font-semibold text-[#172033]">
                {formatCurrency(expense.amount)}
            </td>

            <td className="px-5 py-4 text-sm text-[#697386]">
                {formatDateTime(expense.occurredAt)}
            </td>

            <td className="px-5 py-4">
                <AnomalyBadge expense={expense} />
            </td>

            <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                    <IconButton
                        label="编辑"
                        onClick={onEdit}
                    >
                        <Edit3 size={15} />
                    </IconButton>

                    <IconButton
                        label="删除"
                        onClick={onDelete}
                        danger
                    >
                        <Trash2 size={15} />
                    </IconButton>
                </div>
            </td>
        </tr>
    );
}

function ExpenseMobileCard({
                               expense,
                               onEdit,
                               onDelete,
                           }: ExpenseRowProps) {
    return (
        <article className="p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-medium text-[#273147]">
                        {expense.itemName}
                    </p>

                    <p className="mt-1 text-xs text-[#9299a5]">
                        {expense.categoryName}
                        {" · "}
                        {formatDateTime(expense.occurredAt)}
                    </p>
                </div>

                <p className="font-semibold text-[#172033]">
                    {formatCurrency(expense.amount)}
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <AnomalyBadge expense={expense} />

                <div className="flex gap-2">
                    <IconButton
                        label="编辑"
                        onClick={onEdit}
                    >
                        <Edit3 size={15} />
                    </IconButton>

                    <IconButton
                        label="删除"
                        onClick={onDelete}
                        danger
                    >
                        <Trash2 size={15} />
                    </IconButton>
                </div>
            </div>
        </article>
    );
}

function AnomalyBadge({
                          expense,
                      }: {
    expense: ExpenseRecord;
}) {
    switch (expense.anomalyLevel) {
        case "WARNING":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
          <CircleAlert size={13} />
                    {expense.anomalyConfirmed
                        ? "异常已确认"
                        : "金额异常"}
        </span>
            );

        case "NOTICE":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
          <CircleAlert size={13} />
          建议关注
        </span>
            );

        default:
            return (
                <span className="rounded-full bg-[#eef2f0] px-3 py-1.5 text-xs font-medium text-[#5e6c66]">
          正常
        </span>
            );
    }
}

interface IconButtonProps {
    label: string;
    danger?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function IconButton({
                        label,
                        danger = false,
                        onClick,
                        children,
                    }: IconButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={[
                "flex h-9 w-9 items-center justify-center rounded-[11px] border transition",
                danger
                    ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-[#e0e3e8] bg-white text-[#657080] hover:border-[#d1bd9b] hover:text-[#8a642f]",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function EmptyExpenses({
                           onCreate,
                       }: {
    onCreate: () => void;
}) {
    return (
        <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f4ead8] text-[#9b733a]">
                <ReceiptText size={27} />
            </div>

            <p className="mt-5 font-semibold text-[#344054]">
                还没有账单记录
            </p>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#8b93a0]">
                添加第一笔消费后，系统会自动更新财务总览、预算使用情况和消费趋势。
            </p>

            <button
                type="button"
                onClick={onCreate}
                className="mt-6 flex h-11 items-center gap-2 rounded-[14px] bg-[#09152f] px-5 text-sm font-medium text-white"
            >
                <Plus size={16} />
                添加第一笔账单
            </button>
        </div>
    );
}

interface PaginationProps {
    pageData: ExpensePageResponse;
    onPrevious: () => void;
    onNext: () => void;
}

function Pagination({
                        pageData,
                        onPrevious,
                        onNext,
                    }: PaginationProps) {
    return (
        <div className="flex items-center justify-between border-t border-[#e8e9ec] px-6 py-4">
            <p className="text-xs text-[#8a92a0]">
                第{pageData.page + 1}页，共
                {Math.max(pageData.totalPages, 1)}页
            </p>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={pageData.first}
                    className="finance-secondary-button disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={15} />
                    上一页
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={pageData.last}
                    className="finance-secondary-button disabled:cursor-not-allowed disabled:opacity-40"
                >
                    下一页
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
}