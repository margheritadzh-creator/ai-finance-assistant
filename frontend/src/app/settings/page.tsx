"use client";

import {
  useRouter } from "next/navigation";
import {
    type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useState,
  } from "react";

import {
    AlertTriangle,
  BellRing,
  Check,
  Edit3,
  LoaderCircle,
  Save,
  Settings,
  Trash2,
  WalletCards,
} from "lucide-react";

import { apiRequest, ApiError } from "@/lib/api";
import {
    clearAuth,
    getAccessToken,
} from "@/lib/auth-storage";
import {
    formatCurrency,
    formatMonth,
    formatRatio,
} from "@/lib/format";
import { getFieldErrors } from "@/lib/validation";
import {
    budgetFormSchema,
    preferenceFormSchema,
    type BudgetFormValues,
    type PreferenceFormValues,
} from "@/schemas/settings";
import type {
    BudgetItem,
    BudgetOverview,
} from "@/types/analytics";
import type { CurrentUser } from "@/types/auth";
import type { ExpenseCategory } from "@/types/expense";
import type {
    BudgetUpsertPayload,
    LanguageCode,
    SpendingLevel,
    UserPreference,
    UserPreferenceUpdatePayload,
    WarningLevel,
} from "@/types/settings";

import {
    FinanceHeader,
} from "@/components/finance-header";

const emptyPreferenceForm: PreferenceFormValues = {
    regionCode: "",
    regionName: "",
    priceIndex: "1",
    spendingLevel: "STANDARD",
    monthlyIncome: "",
    defaultMonthlyBudget: "",
    warningEnabled: true,
    warningLevel: "MEDIUM",
    preferredLanguage: "zh-CN",
    speechLanguage: "zh-CN",
};

const emptyBudgetForm: BudgetFormValues = {
    categoryId: "",
    limitAmount: "",
    alertRatio: "0.80",
};

export default function SettingsPage() {
    const router = useRouter();

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [categories, setCategories] = useState<
        ExpenseCategory[]
    >([]);

    const [preference, setPreference] =
        useState<UserPreference | null>(null);

    const [budgetOverview, setBudgetOverview] =
        useState<BudgetOverview | null>(null);

    const [
        preferenceForm,
        setPreferenceForm,
    ] = useState<PreferenceFormValues>(
        emptyPreferenceForm,
    );

    const [budgetForm, setBudgetForm] =
        useState<BudgetFormValues>(
            emptyBudgetForm,
        );

    const [selectedMonth, setSelectedMonth] =
        useState(currentMonthValue());

    const [
        preferenceErrors,
        setPreferenceErrors,
    ] = useState<Record<string, string>>({});

    const [budgetErrors, setBudgetErrors] =
        useState<Record<string, string>>({});

    const [loading, setLoading] =
        useState(true);

    const [
        preferenceSaving,
        setPreferenceSaving,
    ] = useState(false);

    const [budgetSaving, setBudgetSaving] =
        useState(false);

    const [budgetLoading, setBudgetLoading] =
        useState(false);

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
                categoryList,
                currentPreference,
                currentBudget,
            ] = await Promise.all([
                apiRequest<CurrentUser>(
                    "/api/auth/me",
                ),

                apiRequest<ExpenseCategory[]>(
                    "/api/categories",
                ),

                apiRequest<UserPreference>(
                    "/api/preferences",
                ),

                apiRequest<BudgetOverview>(
                    `/api/budgets/overview?month=${month}-01`,
                ),
            ]);

            setUser(currentUser);
            setCategories(categoryList);
            setPreference(currentPreference);
            setBudgetOverview(currentBudget);
            setSelectedMonth(month);

            setPreferenceForm(
                preferenceToForm(currentPreference),
            );
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
                    : "财务设置加载失败",
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

    async function loadBudget(
        month: string,
    ) {
        setBudgetLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response =
                await apiRequest<BudgetOverview>(
                    `/api/budgets/overview?month=${month}-01`,
                );

            setBudgetOverview(response);
            setBudgetForm(emptyBudgetForm);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "预算数据加载失败",
            );
        } finally {
            setBudgetLoading(false);
        }
    }

    async function handleMonthChange(
        value: string,
    ) {
        setSelectedMonth(value);

        if (value) {
            await loadBudget(value);
        }
    }

    function updatePreferenceField<
        Key extends keyof PreferenceFormValues,
    >(
        field: Key,
        value: PreferenceFormValues[Key],
    ) {
        setPreferenceForm((current) => ({
            ...current,
            [field]: value,
        }));

        setPreferenceErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];

            return next;
        });
    }

    function updateBudgetField<
        Key extends keyof BudgetFormValues,
    >(
        field: Key,
        value: BudgetFormValues[Key],
    ) {
        setBudgetForm((current) => ({
            ...current,
            [field]: value,
        }));

        setBudgetErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];

            return next;
        });
    }

    async function savePreference(
        event: SyntheticEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setPreferenceErrors({});
        setErrorMessage("");
        setSuccessMessage("");

        const parsed =
            preferenceFormSchema.safeParse(
                preferenceForm,
            );

        if (!parsed.success) {
            setPreferenceErrors(
                getFieldErrors(parsed.error),
            );
            return;
        }

        const payload: UserPreferenceUpdatePayload = {
            regionCode:
                parsed.data.regionCode
                    .trim()
                    .toUpperCase(),

            regionName:
                parsed.data.regionName.trim(),

            priceIndex: Number(
                parsed.data.priceIndex,
            ),

            spendingLevel:
                parsed.data
                    .spendingLevel as SpendingLevel,

            monthlyIncome:
                parsed.data.monthlyIncome === ""
                    ? null
                    : Number(
                        parsed.data.monthlyIncome,
                    ),

            defaultMonthlyBudget:
                parsed.data
                    .defaultMonthlyBudget === ""
                    ? null
                    : Number(
                        parsed.data
                            .defaultMonthlyBudget,
                    ),

            warningEnabled:
            parsed.data.warningEnabled,

            warningLevel:
                parsed.data
                    .warningLevel as WarningLevel,

            preferredLanguage:
                parsed.data
                    .preferredLanguage as LanguageCode,

            speechLanguage:
                parsed.data
                    .speechLanguage as LanguageCode,

            currency: "CNY",
        };

        setPreferenceSaving(true);

        try {
            const response =
                await apiRequest<UserPreference>(
                    "/api/preferences",
                    {
                        method: "PUT",
                        body: JSON.stringify(payload),
                    },
                );

            setPreference(response);
            setPreferenceForm(
                preferenceToForm(response),
            );

            setSuccessMessage(
                "消费偏好已经保存。",
            );
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
                setPreferenceErrors(
                    error.fieldErrors,
                );
            } else {
                setErrorMessage(
                    "消费偏好保存失败。",
                );
            }
        } finally {
            setPreferenceSaving(false);
        }
    }

    async function saveBudget(
        event: SyntheticEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setBudgetErrors({});
        setErrorMessage("");
        setSuccessMessage("");

        const parsed =
            budgetFormSchema.safeParse(
                budgetForm,
            );

        if (!parsed.success) {
            setBudgetErrors(
                getFieldErrors(parsed.error),
            );
            return;
        }

        const payload: BudgetUpsertPayload = {
            categoryId:
                parsed.data.categoryId === ""
                    ? null
                    : Number(
                        parsed.data.categoryId,
                    ),

            budgetMonth:
                `${selectedMonth}-01`,

            limitAmount: Number(
                parsed.data.limitAmount,
            ),

            alertRatio: Number(
                parsed.data.alertRatio,
            ),
        };

        setBudgetSaving(true);

        try {
            await apiRequest<BudgetItem>(
                "/api/budgets",
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                },
            );

            setSuccessMessage(
                payload.categoryId === null
                    ? "本月总预算已经保存。"
                    : "分类预算已经保存。",
            );

            setBudgetForm(emptyBudgetForm);

            await loadBudget(selectedMonth);
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
                setBudgetErrors(
                    error.fieldErrors,
                );
            } else {
                setErrorMessage(
                    "预算保存失败。",
                );
            }
        } finally {
            setBudgetSaving(false);
        }
    }

    async function deleteBudget(
        budget: BudgetItem,
    ) {
        const confirmed = window.confirm(
            `确定删除“${budget.categoryName}”预算吗？`,
        );

        if (!confirmed) {
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");

        try {
            await apiRequest<void>(
                `/api/budgets/${budget.id}`,
                {
                    method: "DELETE",
                },
            );

            setSuccessMessage(
                "预算记录已经删除。",
            );

            await loadBudget(selectedMonth);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "预算删除失败。",
            );
        }
    }

    function editBudget(
        budget: BudgetItem,
    ) {
        setBudgetForm({
            categoryId:
                budget.categoryId === null
                    ? ""
                    : String(budget.categoryId),

            limitAmount: String(
                budget.limitAmount,
            ),

            alertRatio: String(
                budget.alertRatio,
            ),
        });

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="flex items-center gap-3 text-[#344054]">
                    <LoaderCircle
                        size={21}
                        className="animate-spin text-[#9b733a]"
                    />
                    正在加载财务设置
                </div>
            </main>
        );
    }

    if (
        !user ||
        !preference ||
        !budgetOverview
    ) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <div className="finance-surface max-w-md rounded-[24px] p-8 text-center">
                    <AlertTriangle
                        size={28}
                        className="mx-auto text-amber-600"
                    />

                    <p className="mt-4 text-[#4a5568]">
                        {errorMessage ||
                            "暂时无法加载财务设置"}
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
            <div className="mx-auto max-w-[1380px]">
                <FinanceHeader
                    displayName={user.displayName}
                    email={user.email}
                />

                <section className="mt-9">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#9b733a]">
                        财务设置
                    </p>

                    <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.045em] text-[#111827]">
                        偏好与预算管理
                    </h1>

                    <p className="mt-3 text-[15px] text-[#747d8d]">
                        设置个人消费习惯、地区物价和月度预算，让分析结果更符合实际情况。
                    </p>
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
                    <div className="mt-5 flex items-center gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <Check size={17} />
                        {successMessage}
                    </div>
                )}

                <section className="mt-7 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                    <form
                        onSubmit={savePreference}
                        className="finance-surface rounded-[25px] p-6 sm:p-7"
                        noValidate
                    >
                        <SectionHeading
                            icon={<Settings size={20} />}
                            title="消费偏好"
                            description="用于调整异常金额判断和个性化建议"
                        />

                        <div className="mt-7 grid gap-5 sm:grid-cols-2">
                            <FormField
                                label="地区名称"
                                error={
                                    preferenceErrors.regionName
                                }
                            >
                                <input
                                    value={
                                        preferenceForm.regionName
                                    }
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "regionName",
                                            event.target.value,
                                        )
                                    }
                                    className="finance-input"
                                    placeholder="例如：上海"
                                />
                            </FormField>

                            <FormField
                                label="地区代码"
                                error={
                                    preferenceErrors.regionCode
                                }
                            >
                                <input
                                    value={
                                        preferenceForm.regionCode
                                    }
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "regionCode",
                                            event.target.value,
                                        )
                                    }
                                    className="finance-input"
                                    placeholder="例如：CN-SH"
                                />
                            </FormField>

                            <FormField
                                label="地区物价系数"
                                error={
                                    preferenceErrors.priceIndex
                                }
                            >
                                <input
                                    type="number"
                                    min="0.1"
                                    max="10"
                                    step="0.01"
                                    value={
                                        preferenceForm.priceIndex
                                    }
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "priceIndex",
                                            event.target.value,
                                        )
                                    }
                                    className="finance-input"
                                />

                                <p className="mt-2 text-xs leading-5 text-[#9299a5]">
                                    1表示标准水平，较高物价地区可填写1.2至1.5。
                                </p>
                            </FormField>

                            <FormField
                                label="日常消费水平"
                                error={
                                    preferenceErrors
                                        .spendingLevel
                                }
                            >
                                <select
                                    value={
                                        preferenceForm
                                            .spendingLevel
                                    }
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "spendingLevel",
                                            event.target
                                                .value as SpendingLevel,
                                        )
                                    }
                                    className="finance-input"
                                >
                                    <option value="ECONOMICAL">
                                        节俭型
                                    </option>
                                    <option value="STANDARD">
                                        标准型
                                    </option>
                                    <option value="COMFORTABLE">
                                        舒适型
                                    </option>
                                    <option value="PREMIUM">
                                        高消费型
                                    </option>
                                    <option value="CUSTOM">
                                        自定义
                                    </option>
                                </select>
                            </FormField>

                            <FormField
                                label="月收入"
                                error={
                                    preferenceErrors
                                        .monthlyIncome
                                }
                            >
                                <MoneyInput
                                    value={
                                        preferenceForm
                                            .monthlyIncome
                                    }
                                    onChange={(value) =>
                                        updatePreferenceField(
                                            "monthlyIncome",
                                            value,
                                        )
                                    }
                                    placeholder="选填"
                                />
                            </FormField>

                            <FormField
                                label="默认月预算"
                                error={
                                    preferenceErrors
                                        .defaultMonthlyBudget
                                }
                            >
                                <MoneyInput
                                    value={
                                        preferenceForm
                                            .defaultMonthlyBudget
                                    }
                                    onChange={(value) =>
                                        updatePreferenceField(
                                            "defaultMonthlyBudget",
                                            value,
                                        )
                                    }
                                    placeholder="选填"
                                />

                                <p className="mt-2 text-xs leading-5 text-[#9299a5]">
                                    这是长期预算参考值，具体月份预算在右侧设置。
                                </p>
                            </FormField>

                            <FormField
                                label="异常提醒灵敏度"
                                error={
                                    preferenceErrors.warningLevel
                                }
                            >
                                <select
                                    value={
                                        preferenceForm.warningLevel
                                    }
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "warningLevel",
                                            event.target
                                                .value as WarningLevel,
                                        )
                                    }
                                    className="finance-input"
                                    disabled={
                                        !preferenceForm
                                            .warningEnabled
                                    }
                                >
                                    <option value="HIGH">
                                        高灵敏度
                                    </option>
                                    <option value="MEDIUM">
                                        标准灵敏度
                                    </option>
                                    <option value="LOW">
                                        低灵敏度
                                    </option>
                                </select>
                            </FormField>

                            <div className="flex items-center rounded-[16px] border border-[#e0e3e8] bg-[#f8f8f7] px-4 py-3">
                                <input
                                    id="warning-enabled"
                                    type="checkbox"
                                    checked={
                                        preferenceForm
                                            .warningEnabled
                                    }
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "warningEnabled",
                                            event.target.checked,
                                        )
                                    }
                                    className="h-4 w-4 accent-[#9b733a]"
                                />

                                <label
                                    htmlFor="warning-enabled"
                                    className="ml-3 cursor-pointer"
                                >
                                    <p className="text-sm font-medium text-[#344054]">
                                        开启异常金额提醒
                                    </p>

                                    <p className="mt-1 text-xs text-[#9299a5]">
                                        在保存明显异常的账单前再次确认
                                    </p>
                                </label>
                            </div>

                            <FormField
                                label="页面语言"
                                error={
                                    preferenceErrors
                                        .preferredLanguage
                                }
                            >
                                <select
                                    value={
                                        preferenceForm
                                            .preferredLanguage
                                    }
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "preferredLanguage",
                                            event.target
                                                .value as LanguageCode,
                                        )
                                    }
                                    className="finance-input"
                                >
                                    <option value="zh-CN">
                                        中文
                                    </option>
                                    <option value="en-US">
                                        英语
                                    </option>
                                </select>
                            </FormField>

                            <FormField
                                label="语音识别语言"
                                error={
                                    preferenceErrors
                                        .speechLanguage
                                }
                            >
                                <select
                                    value={
                                        preferenceForm
                                            .speechLanguage
                                    }
                                    onChange={(event) =>
                                        updatePreferenceField(
                                            "speechLanguage",
                                            event.target
                                                .value as LanguageCode,
                                        )
                                    }
                                    className="finance-input"
                                >
                                    <option value="zh-CN">
                                        中文普通话
                                    </option>
                                    <option value="en-US">
                                        英语
                                    </option>
                                </select>
                            </FormField>
                        </div>

                        <div className="mt-7 flex justify-end border-t border-[#e5e7eb] pt-5">
                            <button
                                type="submit"
                                disabled={preferenceSaving}
                                className="finance-primary-button sm:w-auto sm:min-w-[160px]"
                            >
                                {preferenceSaving ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={17} />
                                )}

                                保存消费偏好
                            </button>
                        </div>
                    </form>

                    <div className="space-y-6">
                        <article className="finance-surface rounded-[25px] p-6 sm:p-7">
                            <SectionHeading
                                icon={<WalletCards size={20} />}
                                title="月度预算"
                                description="设置总预算或单个消费分类的预算"
                            />

                            <div className="mt-6">
                                <FormField label="查看月份">
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(event) =>
                                            void handleMonthChange(
                                                event.target.value,
                                            )
                                        }
                                        className="finance-input"
                                    />
                                </FormField>
                            </div>

                            {budgetLoading ? (
                                <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-[#697386]">
                                    <LoaderCircle
                                        size={18}
                                        className="animate-spin text-[#9b733a]"
                                    />
                                    正在加载预算
                                </div>
                            ) : (
                                <>
                                    <div className="mt-6 rounded-[20px] bg-[linear-gradient(145deg,#071126,#102445)] p-6 text-white">
                                        <p className="text-xs text-white/55">
                                            {formatMonth(
                                                budgetOverview
                                                    .budgetMonth,
                                            )}
                                            预算使用情况
                                        </p>

                                        <div className="mt-5 flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-white/45">
                                                    预算总额
                                                </p>

                                                <p className="mt-2 text-2xl font-semibold">
                                                    {formatCurrency(
                                                        budgetOverview
                                                            .totalBudget,
                                                    )}
                                                </p>
                                            </div>

                                            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs text-[#dec79f]">
                        {translateBudgetStatus(
                            budgetOverview.status,
                        )}
                      </span>
                                        </div>

                                        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-[linear-gradient(90deg,#dec79f,#b78d4e)]"
                                                style={{
                                                    width: `${Math.min(
                                                        Number(
                                                            budgetOverview
                                                                .usageRatio,
                                                        ) * 100,
                                                        100,
                                                    )}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-4">
                                            <BudgetSummary
                                                title="已经使用"
                                                value={formatCurrency(
                                                    budgetOverview
                                                        .totalSpent,
                                                )}
                                            />

                                            <BudgetSummary
                                                title="剩余预算"
                                                value={formatCurrency(
                                                    budgetOverview
                                                        .remainingBudget,
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <p className="text-sm font-semibold text-[#344054]">
                                            已设置预算
                                        </p>

                                        {budgetOverview.items.length ===
                                        0 ? (
                                            <div className="mt-4 rounded-[17px] border border-dashed border-[#d9dde4] px-5 py-8 text-center text-sm text-[#8b93a0]">
                                                当前月份还没有预算记录
                                            </div>
                                        ) : (
                                            <div className="mt-4 space-y-3">
                                                {budgetOverview.items.map(
                                                    (budget) => (
                                                        <BudgetRow
                                                            key={budget.id}
                                                            budget={budget}
                                                            onEdit={() =>
                                                                editBudget(budget)
                                                            }
                                                            onDelete={() =>
                                                                void deleteBudget(
                                                                    budget,
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </article>

                        <form
                            onSubmit={saveBudget}
                            className="finance-surface rounded-[25px] p-6 sm:p-7"
                            noValidate
                        >
                            <SectionHeading
                                icon={<BellRing size={20} />}
                                title="新增或修改预算"
                                description="同一月份和分类会自动更新原有预算"
                            />

                            <div className="mt-6 space-y-5">
                                <FormField
                                    label="预算类型"
                                    error={
                                        budgetErrors.categoryId
                                    }
                                >
                                    <select
                                        value={
                                            budgetForm.categoryId
                                        }
                                        onChange={(event) =>
                                            updateBudgetField(
                                                "categoryId",
                                                event.target.value,
                                            )
                                        }
                                        className="finance-input"
                                    >
                                        <option value="">
                                            整月总预算
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
                                </FormField>

                                <FormField
                                    label="预算金额"
                                    error={
                                        budgetErrors.limitAmount
                                    }
                                >
                                    <MoneyInput
                                        value={
                                            budgetForm.limitAmount
                                        }
                                        onChange={(value) =>
                                            updateBudgetField(
                                                "limitAmount",
                                                value,
                                            )
                                        }
                                        placeholder="请输入预算金额"
                                    />
                                </FormField>

                                <FormField
                                    label="提醒比例"
                                    error={
                                        budgetErrors.alertRatio
                                    }
                                >
                                    <select
                                        value={
                                            budgetForm.alertRatio
                                        }
                                        onChange={(event) =>
                                            updateBudgetField(
                                                "alertRatio",
                                                event.target.value,
                                            )
                                        }
                                        className="finance-input"
                                    >
                                        <option value="0.70">
                                            使用到70%时提醒
                                        </option>
                                        <option value="0.80">
                                            使用到80%时提醒
                                        </option>
                                        <option value="0.90">
                                            使用到90%时提醒
                                        </option>
                                        <option value="1.00">
                                            达到预算时提醒
                                        </option>
                                    </select>
                                </FormField>
                            </div>

                            <button
                                type="submit"
                                disabled={budgetSaving}
                                className="finance-primary-button mt-6"
                            >
                                {budgetSaving ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={17} />
                                )}

                                保存本月预算
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    );
}

interface SectionHeadingProps {
    icon: ReactNode;
    title: string;
    description: string;
}

function SectionHeading({
                            icon,
                            title,
                            description,
                        }: SectionHeadingProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f4ead8] text-[#9b733a]">
                {icon}
            </div>

            <div>
                <p className="font-semibold text-[#273147]">
                    {title}
                </p>

                <p className="mt-1 text-xs text-[#9299a5]">
                    {description}
                </p>
            </div>
        </div>
    );
}

interface FormFieldProps {
    label: string;
    error?: string;
    children: ReactNode;
}

function FormField({
                       label,
                       error,
                       children,
                   }: FormFieldProps) {
    return (
        <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#344054]">
        {label}
      </span>

            {children}

            {error && (
                <span className="mt-2 block text-sm text-red-600">
          {error}
        </span>
            )}
        </label>
    );
}

interface MoneyInputProps {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
}

function MoneyInput({
                        value,
                        placeholder,
                        onChange,
                    }: MoneyInputProps) {
    return (
        <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center border-r border-[#e5e7eb] text-sm font-medium text-[#9b733a]">
        ¥
      </span>

            <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
                className="finance-input"
                style={{
                    paddingLeft: "3.5rem",
                }}
            />
        </div>
    );
}

interface BudgetSummaryProps {
    title: string;
    value: string;
}

function BudgetSummary({
                           title,
                           value,
                       }: BudgetSummaryProps) {
    return (
        <div className="rounded-[15px] bg-white/[0.06] p-4">
            <p className="text-[11px] text-white/40">
                {title}
            </p>

            <p className="mt-2 text-sm font-medium text-white/85">
                {value}
            </p>
        </div>
    );
}

interface BudgetRowProps {
    budget: BudgetItem;
    onEdit: () => void;
    onDelete: () => void;
}

function BudgetRow({
                       budget,
                       onEdit,
                       onDelete,
                   }: BudgetRowProps) {
    return (
        <div className="rounded-[17px] border border-[#e3e5e9] bg-[#fbfaf7] p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-[#344054]">
                        {budget.categoryName}
                    </p>

                    <p className="mt-1 text-xs text-[#9299a5]">
                        已使用
                        {formatCurrency(
                            budget.spentAmount,
                        )}
                        ，占
                        {formatRatio(
                            budget.usageRatio,
                        )}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-sm font-semibold text-[#172033]">
                        {formatCurrency(
                            budget.limitAmount,
                        )}
                    </p>

                    <p className="mt-1 text-[11px] text-[#9b733a]">
                        {translateBudgetStatus(
                            budget.status,
                        )}
                    </p>
                </div>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e9ebef]">
                <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#c7a66c,#9b733a)]"
                    style={{
                        width: `${Math.min(
                            Number(budget.usageRatio) *
                            100,
                            100,
                        )}%`,
                    }}
                />
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex h-9 items-center gap-2 rounded-[11px] border border-[#e0e3e8] bg-white px-3 text-xs text-[#657080]"
                >
                    <Edit3 size={14} />
                    修改
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="flex h-9 items-center gap-2 rounded-[11px] border border-red-100 bg-red-50 px-3 text-xs text-red-600"
                >
                    <Trash2 size={14} />
                    删除
                </button>
            </div>
        </div>
    );
}

function preferenceToForm(
    preference: UserPreference,
): PreferenceFormValues {
    return {
        regionCode:
            preference.regionCode ?? "",

        regionName:
            preference.regionName ?? "",

        priceIndex: String(
            preference.priceIndex ?? 1,
        ),

        spendingLevel:
        preference.spendingLevel,

        monthlyIncome:
            preference.monthlyIncome === null
                ? ""
                : String(
                    preference.monthlyIncome,
                ),

        defaultMonthlyBudget:
            preference.defaultMonthlyBudget ===
            null
                ? ""
                : String(
                    preference
                        .defaultMonthlyBudget,
                ),

        warningEnabled:
        preference.warningEnabled,

        warningLevel:
        preference.warningLevel,

        preferredLanguage:
        preference.preferredLanguage,

        speechLanguage:
        preference.speechLanguage,
    };
}

function currentMonthValue(): string {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1,
    ).padStart(2, "0");

    return `${year}-${month}`;
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
            return "未设置预算";
    }
}