"use client";

import { useRouter } from "next/navigation";
import {
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Edit3,
    Filter,
    LoaderCircle,
    Plus,
    ReceiptText,
    RotateCcw,
    Search,
    Trash2,
} from "lucide-react";

import { ExpenseFormModal } from "@/components/expense-form-modal";
import { FinanceHeader } from "@/components/finance-header";
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

const PAGE_SIZE = 10;

type ExpenseSortBy =
    | "occurredAt"
    | "amount";

type ExpenseSortDirection =
    | "asc"
    | "desc";

type ExpenseAnomalyFilter =
    | ""
    | "NONE"
    | "NOTICE"
    | "WARNING";

interface ExpenseFilters {
    keyword: string;
    categoryId: string;
    startDate: string;
    endDate: string;
    anomalyLevel: ExpenseAnomalyFilter;
    minAmount: string;
    maxAmount: string;
    sortBy: ExpenseSortBy;
    sortDirection: ExpenseSortDirection;
}

const DEFAULT_FILTERS: ExpenseFilters = {
    keyword: "",
    categoryId: "",
    startDate: "",
    endDate: "",
    anomalyLevel: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "occurredAt",
    sortDirection: "desc",
};

export default function ExpensesPage() {
    const router = useRouter();

    const hasLoadedRef = useRef(false);

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [categories, setCategories] =
        useState<ExpenseCategory[]>([]);

    const [pageData, setPageData] =
        useState<ExpensePageResponse | null>(
            null,
        );

    const [page, setPage] =
        useState(0);

    const [
        filterDraft,
        setFilterDraft,
    ] = useState<ExpenseFilters>({
        ...DEFAULT_FILTERS,
    });

    const [
        appliedFilters,
        setAppliedFilters,
    ] = useState<ExpenseFilters>({
        ...DEFAULT_FILTERS,
    });

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        filterError,
        setFilterError,
    ] = useState("");

    const [modalOpen, setModalOpen] =
        useState(false);

    const [
        editingExpense,
        setEditingExpense,
    ] = useState<ExpenseRecord | null>(
        null,
    );

    const loadData = useCallback(
        async (forceRefresh = false) => {
            const token = getAccessToken();

            if (!token) {
                router.replace("/login");
                return;
            }

            const showRefreshState =
                forceRefresh ||
                hasLoadedRef.current;

            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setErrorMessage("");

            try {
                const expenseUrl =
                    buildExpenseQuery(
                        page,
                        PAGE_SIZE,
                        appliedFilters,
                    );

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
                        expenseUrl,
                    ),
                ]);

                setUser(currentUser);
                setCategories(categoryList);
                setPageData(expensePage);

                hasLoadedRef.current = true;
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
        [
            appliedFilters,
            page,
            router,
        ],
    );

    useEffect(() => {
        const timerId =
            window.setTimeout(() => {
                void loadData();
            }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [loadData]);

    function updateFilter<
        Key extends keyof ExpenseFilters,
    >(
        key: Key,
        value: ExpenseFilters[Key],
    ) {
        setFilterDraft((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function applyFilters() {
        const normalizedFilters =
            normalizeFilters(filterDraft);

        const validationMessage =
            validateFilters(normalizedFilters);

        if (validationMessage) {
            setFilterError(
                validationMessage,
            );
            return;
        }

        setFilterError("");
        setPage(0);
        setAppliedFilters(
            normalizedFilters,
        );
    }

    function resetFilters() {
        const clearedFilters = {
            ...DEFAULT_FILTERS,
        };

        setFilterError("");
        setFilterDraft(clearedFilters);
        setPage(0);
        setAppliedFilters(clearedFilters);
    }

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
                setPage(
                    (current) =>
                        current - 1,
                );
            } else {
                await loadData(true);
            }
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
                        {errorMessage ||
                            "暂时无法加载账单"}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void loadData()
                        }
                        className="mt-5 rounded-[13px] bg-[#09152f] px-5 py-3 text-sm font-medium text-white"
                    >
                        重新加载
                    </button>
                </div>
            </main>
        );
    }

    const activeFilterCount =
        countActiveFilters(
            appliedFilters,
        );

    return (
        <>
            <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
                <div className="mx-auto max-w-[1380px]">
                    <FinanceHeader
                        displayName={
                            user.displayName
                        }
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
                                当前共找到
                                {pageData.totalElements}
                                笔消费记录。
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

                    <ExpenseFilterPanel
                        categories={categories}
                        filters={filterDraft}
                        activeFilterCount={
                            activeFilterCount
                        }
                        errorMessage={filterError}
                        refreshing={refreshing}
                        onChange={updateFilter}
                        onApply={applyFilters}
                        onReset={resetFilters}
                    />

                    <section className="finance-surface mt-5 overflow-hidden rounded-[25px]">
                        <div className="flex flex-col gap-4 border-b border-[#e7e8eb] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-semibold text-[#273147]">
                                    账单明细
                                </p>

                                <p className="mt-1 text-xs text-[#9299a5]">
                                    {getSortDescription(
                                        appliedFilters,
                                    )}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {activeFilterCount > 0 && (
                                    <span className="rounded-full bg-[#f4ead8] px-3 py-2 text-xs font-medium text-[#80602f]">
                    已启用
                                        {activeFilterCount}
                                        项筛选
                  </span>
                                )}

                                <div className="flex items-center gap-2 rounded-[13px] border border-[#e0e3e8] bg-[#f8f9fa] px-3 py-2 text-xs text-[#7b8492]">
                                    {refreshing ? (
                                        <LoaderCircle
                                            size={14}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Search size={14} />
                                    )}

                                    当前第
                                    {pageData.page + 1}
                                    页
                                </div>
                            </div>
                        </div>

                        {pageData.content.length ===
                        0 ? (
                            <EmptyFilterResult
                                hasFilters={
                                    activeFilterCount > 0
                                }
                                onReset={resetFilters}
                                onCreate={
                                    openCreateModal
                                }
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
                                                    key={
                                                        expense.id
                                                    }
                                                    expense={
                                                        expense
                                                    }
                                                    onEdit={() =>
                                                        openEditModal(
                                                            expense,
                                                        )
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
                                                    openEditModal(
                                                        expense,
                                                    )
                                                }
                                                onDelete={() =>
                                                    void deleteExpense(
                                                        expense,
                                                    )
                                                }
                                            />
                                        ),
                                    )}
                                </div>

                                <Pagination
                                    pageData={pageData}
                                    onPrevious={() =>
                                        setPage(
                                            (current) =>
                                                Math.max(
                                                    current - 1,
                                                    0,
                                                ),
                                        )
                                    }
                                    onNext={() =>
                                        setPage(
                                            (current) =>
                                                current + 1,
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

interface ExpenseFilterPanelProps {
    categories: ExpenseCategory[];
    filters: ExpenseFilters;
    activeFilterCount: number;
    errorMessage: string;
    refreshing: boolean;
    onChange: <
        Key extends keyof ExpenseFilters,
    >(
        key: Key,
        value: ExpenseFilters[Key],
    ) => void;
    onApply: () => void;
    onReset: () => void;
}

function ExpenseFilterPanel({
                                categories,
                                filters,
                                activeFilterCount,
                                errorMessage,
                                refreshing,
                                onChange,
                                onApply,
                                onReset,
                            }: ExpenseFilterPanelProps) {
    return (
        <section className="finance-surface mt-7 rounded-[25px] p-6">
            <div className="flex flex-col gap-4 border-b border-[#e7e8eb] pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f4ead8] text-[#9b733a]">
                        <Filter size={18} />
                    </div>

                    <div>
                        <p className="font-semibold text-[#273147]">
                            搜索与筛选
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#9299a5]">
                            支持项目、商家和备注关键词，以及分类、日期、金额和异常状态。
                        </p>
                    </div>
                </div>

                {activeFilterCount > 0 && (
                    <span className="w-fit rounded-full border border-[#dfcfb3] bg-[#faf4e9] px-3 py-1.5 text-xs text-[#80602f]">
            当前启用
                        {activeFilterCount}
                        项筛选
          </span>
                )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FilterField
                    label="关键词"
                    className="xl:col-span-2"
                >
                    <div className="relative">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#949ba6]"
                        />

                        <input
                            type="search"
                            value={filters.keyword}
                            onChange={(event) =>
                                onChange(
                                    "keyword",
                                    event.target.value,
                                )
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter"
                                ) {
                                    event.preventDefault();
                                    onApply();
                                }
                            }}
                            placeholder="搜索消费项目、商家或备注"
                            className="finance-input pl-10"
                        />
                    </div>
                </FilterField>

                <FilterField label="消费分类">
                    <select
                        value={filters.categoryId}
                        onChange={(event) =>
                            onChange(
                                "categoryId",
                                event.target.value,
                            )
                        }
                        className="finance-input"
                    >
                        <option value="">
                            全部分类
                        </option>

                        {categories.map(
                            (category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.nameZh}
                                </option>
                            ),
                        )}
                    </select>
                </FilterField>

                <FilterField label="异常状态">
                    <select
                        value={
                            filters.anomalyLevel
                        }
                        onChange={(event) =>
                            onChange(
                                "anomalyLevel",
                                event.target
                                    .value as ExpenseAnomalyFilter,
                            )
                        }
                        className="finance-input"
                    >
                        <option value="">
                            全部状态
                        </option>
                        <option value="NONE">
                            正常
                        </option>
                        <option value="NOTICE">
                            建议关注
                        </option>
                        <option value="WARNING">
                            金额异常
                        </option>
                    </select>
                </FilterField>

                <FilterField label="开始日期">
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(event) =>
                            onChange(
                                "startDate",
                                event.target.value,
                            )
                        }
                        className="finance-input"
                    />
                </FilterField>

                <FilterField label="结束日期">
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(event) =>
                            onChange(
                                "endDate",
                                event.target.value,
                            )
                        }
                        className="finance-input"
                    />
                </FilterField>

                <FilterField label="最低金额">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={filters.minAmount}
                        onChange={(event) =>
                            onChange(
                                "minAmount",
                                event.target.value,
                            )
                        }
                        placeholder="例如 10"
                        className="finance-input"
                    />
                </FilterField>

                <FilterField label="最高金额">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={filters.maxAmount}
                        onChange={(event) =>
                            onChange(
                                "maxAmount",
                                event.target.value,
                            )
                        }
                        placeholder="例如 500"
                        className="finance-input"
                    />
                </FilterField>

                <FilterField label="排序字段">
                    <select
                        value={filters.sortBy}
                        onChange={(event) =>
                            onChange(
                                "sortBy",
                                event.target
                                    .value as ExpenseSortBy,
                            )
                        }
                        className="finance-input"
                    >
                        <option value="occurredAt">
                            消费时间
                        </option>
                        <option value="amount">
                            消费金额
                        </option>
                    </select>
                </FilterField>

                <FilterField label="排序方向">
                    <select
                        value={
                            filters.sortDirection
                        }
                        onChange={(event) =>
                            onChange(
                                "sortDirection",
                                event.target
                                    .value as ExpenseSortDirection,
                            )
                        }
                        className="finance-input"
                    >
                        <option value="desc">
                            从高到低 / 从新到旧
                        </option>
                        <option value="asc">
                            从低到高 / 从旧到新
                        </option>
                    </select>
                </FilterField>
            </div>

            {errorMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <CircleAlert
                        size={16}
                        className="mt-0.5 shrink-0"
                    />
                    {errorMessage}
                </div>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-[#e7e8eb] pt-5 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onReset}
                    disabled={refreshing}
                    className="finance-secondary-button"
                >
                    <RotateCcw size={15} />
                    清空筛选
                </button>

                <button
                    type="button"
                    onClick={onApply}
                    disabled={refreshing}
                    className="finance-primary-button sm:min-w-[140px]"
                >
                    {refreshing ? (
                        <LoaderCircle
                            size={16}
                            className="animate-spin"
                        />
                    ) : (
                        <Search size={16} />
                    )}

                    {refreshing
                        ? "正在查询"
                        : "应用筛选"}
                </button>
            </div>
        </section>
    );
}

interface FilterFieldProps {
    label: string;
    className?: string;
    children: ReactNode;
}

function FilterField({
                         label,
                         className = "",
                         children,
                     }: FilterFieldProps) {
    return (
        <label
            className={[
                "block",
                className,
            ].join(" ")}
        >
      <span className="mb-2 block text-xs font-medium text-[#657080]">
        {label}
      </span>

            {children}
        </label>
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
                    {expense.merchant ||
                        "未填写商家"}
                </p>
            </td>

            <td className="px-5 py-4">
        <span className="rounded-full bg-[#f4ead8] px-3 py-1.5 text-xs font-medium text-[#8a642f]">
          {expense.categoryName}
        </span>
            </td>

            <td className="px-5 py-4 text-sm font-semibold text-[#172033]">
                {formatCurrency(
                    expense.amount,
                )}
            </td>

            <td className="px-5 py-4 text-sm text-[#697386]">
                {formatDateTime(
                    expense.occurredAt,
                )}
            </td>

            <td className="px-5 py-4">
                <AnomalyBadge
                    expense={expense}
                />
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
                        {formatDateTime(
                            expense.occurredAt,
                        )}
                    </p>
                </div>

                <p className="font-semibold text-[#172033]">
                    {formatCurrency(
                        expense.amount,
                    )}
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <AnomalyBadge
                    expense={expense}
                />

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
    children: ReactNode;
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

interface EmptyFilterResultProps {
    hasFilters: boolean;
    onReset: () => void;
    onCreate: () => void;
}

function EmptyFilterResult({
                               hasFilters,
                               onReset,
                               onCreate,
                           }: EmptyFilterResultProps) {
    return (
        <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f4ead8] text-[#9b733a]">
                {hasFilters ? (
                    <Search size={27} />
                ) : (
                    <ReceiptText size={27} />
                )}
            </div>

            <p className="mt-5 font-semibold text-[#344054]">
                {hasFilters
                    ? "没有找到符合条件的账单"
                    : "还没有账单记录"}
            </p>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#8b93a0]">
                {hasFilters
                    ? "可以调整关键词、日期、金额或分类条件后重新查询。"
                    : "添加第一笔消费后，系统会自动更新财务总览、预算使用情况和消费趋势。"}
            </p>

            <button
                type="button"
                onClick={
                    hasFilters
                        ? onReset
                        : onCreate
                }
                className="mt-6 flex h-11 items-center gap-2 rounded-[14px] bg-[#09152f] px-5 text-sm font-medium text-white"
            >
                {hasFilters ? (
                    <>
                        <RotateCcw size={16} />
                        清空筛选
                    </>
                ) : (
                    <>
                        <Plus size={16} />
                        添加第一笔账单
                    </>
                )}
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
                {Math.max(
                    pageData.totalPages,
                    1,
                )}
                页
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

function normalizeFilters(
    filters: ExpenseFilters,
): ExpenseFilters {
    return {
        ...filters,
        keyword: filters.keyword.trim(),
        minAmount:
            filters.minAmount.trim(),
        maxAmount:
            filters.maxAmount.trim(),
    };
}

function validateFilters(
    filters: ExpenseFilters,
): string | null {
    if (
        filters.startDate &&
        filters.endDate &&
        filters.startDate >
        filters.endDate
    ) {
        return "开始日期不能晚于结束日期。";
    }

    const minAmount =
        parseOptionalAmount(
            filters.minAmount,
        );

    const maxAmount =
        parseOptionalAmount(
            filters.maxAmount,
        );

    if (
        filters.minAmount &&
        minAmount === null
    ) {
        return "最低金额格式不正确。";
    }

    if (
        filters.maxAmount &&
        maxAmount === null
    ) {
        return "最高金额格式不正确。";
    }

    if (
        minAmount !== null &&
        maxAmount !== null &&
        minAmount > maxAmount
    ) {
        return "最低金额不能大于最高金额。";
    }

    return null;
}

function parseOptionalAmount(
    value: string,
): number | null {
    if (!value.trim()) {
        return null;
    }

    const amount = Number(value);

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {
        return null;
    }

    return amount;
}

function buildExpenseQuery(
    page: number,
    size: number,
    filters: ExpenseFilters,
): string {
    const parameters =
        new URLSearchParams();

    parameters.set(
        "page",
        String(page),
    );

    parameters.set(
        "size",
        String(size),
    );

    if (filters.keyword) {
        parameters.set(
            "keyword",
            filters.keyword,
        );
    }

    if (filters.categoryId) {
        parameters.set(
            "categoryId",
            filters.categoryId,
        );
    }

    if (filters.startDate) {
        parameters.set(
            "startInclusive",
            localDateStartIso(
                filters.startDate,
            ),
        );
    }

    if (filters.endDate) {
        parameters.set(
            "endExclusive",
            localDateNextDayIso(
                filters.endDate,
            ),
        );
    }

    if (filters.anomalyLevel) {
        parameters.set(
            "anomalyLevel",
            filters.anomalyLevel,
        );
    }

    if (filters.minAmount) {
        parameters.set(
            "minAmount",
            filters.minAmount,
        );
    }

    if (filters.maxAmount) {
        parameters.set(
            "maxAmount",
            filters.maxAmount,
        );
    }

    parameters.set(
        "sortBy",
        filters.sortBy,
    );

    parameters.set(
        "sortDirection",
        filters.sortDirection,
    );

    return (
        "/api/expenses?" +
        parameters.toString()
    );
}

function localDateStartIso(
    value: string,
): string {
    const [year, month, day] =
        value
            .split("-")
            .map(Number);

    return new Date(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0,
    ).toISOString();
}

function localDateNextDayIso(
    value: string,
): string {
    const [year, month, day] =
        value
            .split("-")
            .map(Number);

    return new Date(
        year,
        month - 1,
        day + 1,
        0,
        0,
        0,
        0,
    ).toISOString();
}

function countActiveFilters(
    filters: ExpenseFilters,
): number {
    return [
        filters.keyword,
        filters.categoryId,
        filters.startDate,
        filters.endDate,
        filters.anomalyLevel,
        filters.minAmount,
        filters.maxAmount,
    ].filter(Boolean).length;
}

function getSortDescription(
    filters: ExpenseFilters,
): string {
    if (filters.sortBy === "amount") {
        return filters.sortDirection ===
        "asc"
            ? "按消费金额从低到高排列"
            : "按消费金额从高到低排列";
    }

    return filters.sortDirection ===
    "asc"
        ? "按消费时间从旧到新排列"
        : "按消费时间从新到旧排列";
}