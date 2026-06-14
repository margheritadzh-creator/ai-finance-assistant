"use client";

import {
    type ReactNode,
    type SyntheticEvent,
    useState,
} from "react";

import {
    AlertTriangle,
    BrainCircuit,
    Check,
    LoaderCircle,
    Save,
    X,
} from "lucide-react";

import { apiRequest, ApiError } from "@/lib/api";
import {
    formatCurrency,
    toDateTimeLocalValue,
} from "@/lib/format";
import { getFieldErrors } from "@/lib/validation";
import {
    expenseFormSchema,
    type ExpenseFormValues,
} from "@/schemas/expense";
import type {
    ExpenseAnomaly,
    ExpenseCategory,
    ExpenseClassificationResponse,
    ExpenseMutationResponse,
    ExpensePayload,
    ExpenseRecord,
} from "@/types/expense";

interface ExpenseFormModalProps {
    open: boolean;
    expense: ExpenseRecord | null;
    categories: ExpenseCategory[];
    onClose: () => void;
    onSaved: () => void;
}

const emptyForm: ExpenseFormValues = {
    categoryId: "",
    itemName: "",
    merchant: "",
    amount: "",
    quantity: "",
    unit: "",
    occurredAt: "",
    note: "",
};

function createInitialForm(
    expense: ExpenseRecord | null,
): ExpenseFormValues {
    if (!expense) {
        return {
            ...emptyForm,
            occurredAt: toDateTimeLocalValue(),
        };
    }

    return {
        categoryId: String(expense.categoryId),
        itemName: expense.itemName,
        merchant: expense.merchant ?? "",
        amount: String(expense.amount),
        quantity:
            expense.quantity === null
                ? ""
                : String(expense.quantity),
        unit: expense.unit ?? "",
        occurredAt: toDateTimeLocalValue(
            expense.occurredAt,
        ),
        note: expense.note ?? "",
    };
}

export function ExpenseFormModal({
                                     open,
                                     expense,
                                     categories,
                                     onClose,
                                     onSaved,
                                 }: ExpenseFormModalProps) {
    const [form, setForm] =
        useState<ExpenseFormValues>(() =>
            createInitialForm(expense),
            );

    const [fieldErrors, setFieldErrors] = useState<
        Record<string, string>
    >({});

    const [errorMessage, setErrorMessage] =
        useState("");

    const [classificationMessage, setClassificationMessage] =
        useState("");

    const [saving, setSaving] = useState(false);
    const [classifying, setClassifying] =
        useState(false);

    const [pendingPayload, setPendingPayload] =
        useState<ExpensePayload | null>(null);

    const [anomaly, setAnomaly] =
        useState<ExpenseAnomaly | null>(null);

    if (!open) {
        return null;
    }

    function updateField(
        field: keyof ExpenseFormValues,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setFieldErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];

            return next;
        });

        if (
            field === "itemName" ||
            field === "categoryId"
        ) {
            setClassificationMessage("");
        }
    }

    async function classifyExpense() {
        const itemName = form.itemName.trim();

        if (!itemName) {
            setFieldErrors((current) => ({
                ...current,
                itemName: "请先输入消费项目",
            }));
            return;
        }

        setClassifying(true);
        setErrorMessage("");
        setClassificationMessage("");

        try {
            const response =
                await apiRequest<ExpenseClassificationResponse>(
                    "/api/ai/expenses/classify",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            itemName,
                            merchant:
                                cleanOptional(form.merchant),
                            note: cleanOptional(form.note),
                            rawText: null,
                        }),
                    },
                );

            setForm((current) => ({
                ...current,
                categoryId: String(response.categoryId),
            }));

            const confidence = Math.round(
                Number(response.confidence) * 100,
            );

            setClassificationMessage(
                `已识别为“${response.categoryName}”，可信度${confidence}%`,
            );
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "自动分类失败，请手动选择分类",
            );
        } finally {
            setClassifying(false);
        }
    }

    async function handleSubmit(
        event: SyntheticEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setFieldErrors({});
        setErrorMessage("");
        setAnomaly(null);
        setPendingPayload(null);

        const parsed =
            expenseFormSchema.safeParse(form);

        if (!parsed.success) {
            setFieldErrors(
                getFieldErrors(parsed.error),
            );
            return;
        }

        const occurredAt = new Date(
            parsed.data.occurredAt,
        );

        if (Number.isNaN(occurredAt.getTime())) {
            setFieldErrors({
                occurredAt: "消费时间格式不正确",
            });
            return;
        }

        if (
            occurredAt.getTime() >
            Date.now() + 60_000
        ) {
            setFieldErrors({
                occurredAt: "消费时间不能晚于当前时间",
            });
            return;
        }

        const payload: ExpensePayload = {
            categoryId: Number(
                parsed.data.categoryId,
            ),
            itemName: parsed.data.itemName.trim(),
            merchant: cleanOptional(
                parsed.data.merchant,
            ),
            amount: Number(parsed.data.amount),
            currency: "CNY",
            quantity:
                parsed.data.quantity === ""
                    ? null
                    : Number(parsed.data.quantity),
            unit: cleanOptional(parsed.data.unit),
            occurredAt: occurredAt.toISOString(),
            note: cleanOptional(parsed.data.note),
            source: "MANUAL",
            rawText: null,
            confirmAnomaly: false,
        };

        await submitPayload(payload);
    }

    async function submitPayload(
        payload: ExpensePayload,
    ) {
        setSaving(true);
        setErrorMessage("");

        try {
            const path = expense
                ? `/api/expenses/${expense.id}`
                : "/api/expenses";

            const response =
                await apiRequest<ExpenseMutationResponse>(
                    path,
                    {
                        method: expense ? "PUT" : "POST",
                        body: JSON.stringify(payload),
                    },
                );

            if (
                response.confirmationRequired &&
                response.anomaly
            ) {
                setPendingPayload(payload);
                setAnomaly(response.anomaly);
                return;
            }

            if (!response.saved) {
                setErrorMessage("账单保存失败");
                return;
            }

            onSaved();
            onClose();
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
                setFieldErrors(error.fieldErrors);
            } else {
                setErrorMessage("账单保存失败，请稍后重试");
            }
        } finally {
            setSaving(false);
        }
    }

    async function confirmAnomaly() {
        if (!pendingPayload) {
            return;
        }

        await submitPayload({
            ...pendingPayload,
            confirmAnomaly: true,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071126]/55 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[26px] border border-white/30 bg-[#fbfaf7] shadow-[0_30px_100px_rgba(7,17,38,0.35)]">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e6e3dc] bg-[#fbfaf7]/95 px-6 py-5 backdrop-blur-xl sm:px-8">
                    <div>
                        <p className="text-lg font-semibold text-[#172033]">
                            {expense
                                ? "编辑账单"
                                : "新增账单"}
                        </p>

                        <p className="mt-1 text-xs text-[#8b93a0]">
                            填写消费信息，系统会自动检查金额是否异常
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e0e3e8] bg-white text-[#667085] transition hover:bg-[#f3f4f6]"
                        aria-label="关闭"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 px-6 py-6 sm:px-8"
                    noValidate
                >
                    {errorMessage && (
                        <div className="rounded-[15px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMessage}
                        </div>
                    )}

                    {anomaly && (
                        <AnomalyWarning anomaly={anomaly} />
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                            label="消费项目"
                            error={fieldErrors.itemName}
                            className="sm:col-span-2"
                        >
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={form.itemName}
                                    onChange={(event) =>
                                        updateField(
                                            "itemName",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="例如：午餐、地铁、电影票"
                                    className="finance-input"
                                    aria-invalid={Boolean(
                                        fieldErrors.itemName,
                                    )}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        void classifyExpense()
                                    }
                                    disabled={classifying}
                                    className="flex min-w-[132px] items-center justify-center gap-2 rounded-[15px] border border-[#d9c9ad] bg-[#f7f0e3] px-4 text-sm font-medium text-[#8a642f] transition hover:bg-[#f2e6d1] disabled:opacity-60"
                                >
                                    {classifying ? (
                                        <LoaderCircle
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <BrainCircuit size={16} />
                                    )}

                                    自动分类
                                </button>
                            </div>

                            {classificationMessage && (
                                <p className="mt-2 flex items-center gap-2 text-xs text-[#7d633d]">
                                    <Check size={13} />
                                    {classificationMessage}
                                </p>
                            )}
                        </FormField>

                        <FormField
                            label="消费分类"
                            error={fieldErrors.categoryId}
                        >
                            <select
                                value={form.categoryId}
                                onChange={(event) =>
                                    updateField(
                                        "categoryId",
                                        event.target.value,
                                    )
                                }
                                className="finance-input"
                                aria-invalid={Boolean(
                                    fieldErrors.categoryId,
                                )}
                            >
                                <option value="">
                                    请选择分类
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.nameZh}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <FormField
                            label="消费金额"
                            error={fieldErrors.amount}
                        >
                            <div className="relative">
  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center border-r border-[#e5e7eb] text-sm font-medium text-[#9b733a]">
    ¥
  </span>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={form.amount}
                                    onChange={(event) =>
                                        updateField(
                                            "amount",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="0.00"
                                    className="finance-input"
                                    style={{
                                        paddingLeft: "3.5rem",
                                    }}
                                    aria-invalid={Boolean(
                                        fieldErrors.amount,
                                    )}
                                />
                            </div>
                        </FormField>

                        <FormField
                            label="商家名称"
                            error={fieldErrors.merchant}
                        >
                            <input
                                type="text"
                                value={form.merchant}
                                onChange={(event) =>
                                    updateField(
                                        "merchant",
                                        event.target.value,
                                    )
                                }
                                placeholder="选填"
                                className="finance-input"
                                aria-invalid={Boolean(
                                    fieldErrors.merchant,
                                )}
                            />
                        </FormField>

                        <FormField
                            label="消费时间"
                            error={fieldErrors.occurredAt}
                        >
                            <input
                                type="datetime-local"
                                value={form.occurredAt}
                                onChange={(event) =>
                                    updateField(
                                        "occurredAt",
                                        event.target.value,
                                    )
                                }
                                className="finance-input"
                                aria-invalid={Boolean(
                                    fieldErrors.occurredAt,
                                )}
                            />
                        </FormField>

                        <FormField
                            label="数量"
                            error={fieldErrors.quantity}
                        >
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.quantity}
                                onChange={(event) =>
                                    updateField(
                                        "quantity",
                                        event.target.value,
                                    )
                                }
                                placeholder="选填"
                                className="finance-input"
                                aria-invalid={Boolean(
                                    fieldErrors.quantity,
                                )}
                            />
                        </FormField>

                        <FormField
                            label="单位"
                            error={fieldErrors.unit}
                        >
                            <input
                                type="text"
                                value={form.unit}
                                onChange={(event) =>
                                    updateField(
                                        "unit",
                                        event.target.value,
                                    )
                                }
                                placeholder="例如：份、杯、公斤"
                                className="finance-input"
                                aria-invalid={Boolean(
                                    fieldErrors.unit,
                                )}
                            />
                        </FormField>

                        <FormField
                            label="备注"
                            error={fieldErrors.note}
                            className="sm:col-span-2"
                        >
              <textarea
                  value={form.note}
                  onChange={(event) =>
                      updateField(
                          "note",
                          event.target.value,
                      )
                  }
                  placeholder="记录与这笔消费有关的补充信息"
                  rows={4}
                  className="w-full resize-none rounded-[15px] border border-[#dce1e8] bg-white px-4 py-3 text-[#111827] outline-none transition placeholder:text-[#a1a8b3] focus:border-[#c4a36a] focus:ring-4 focus:ring-[#c4a36a]/15"
                  aria-invalid={Boolean(
                      fieldErrors.note,
                  )}
              />
                        </FormField>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-[#e7e4dd] pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={
                                anomaly
                                    ? () => {
                                        setAnomaly(null);
                                        setPendingPayload(null);
                                    }
                                    : onClose
                            }
                            className="finance-secondary-button"
                        >
                            {anomaly ? "返回修改" : "取消"}
                        </button>

                        {anomaly ? (
                            <button
                                type="button"
                                onClick={() =>
                                    void confirmAnomaly()
                                }
                                disabled={saving}
                                className="finance-primary-button sm:w-auto sm:min-w-[150px]"
                            >
                                {saving ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <AlertTriangle size={17} />
                                )}

                                确认金额并保存
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={saving}
                                className="finance-primary-button sm:w-auto sm:min-w-[130px]"
                            >
                                {saving ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={17} />
                                )}

                                保存账单
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

interface FormFieldProps {
    label: string;
    error?: string;
    className?: string;
    children: ReactNode;
}

function FormField({
                       label,
                       error,
                       className = "",
                       children,
                   }: FormFieldProps) {
    return (
        <label className={`block ${className}`}>
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

function AnomalyWarning({
                            anomaly,
                        }: {
    anomaly: ExpenseAnomaly;
}) {
    return (
        <div className="rounded-[18px] border border-amber-300 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <AlertTriangle size={18} />
                </div>

                <div>
                    <p className="font-semibold text-amber-900">
                        系统检测到金额可能异常
                    </p>

                    <p className="mt-2 text-sm leading-6 text-amber-800">
                        {anomaly.message ??
                            "请再次确认金额、数量和单位是否填写正确。"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {anomaly.minReasonable !== null && (
                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-amber-800">
                常见最低：
                                {formatCurrency(
                                    anomaly.minReasonable,
                                )}
              </span>
                        )}

                        {anomaly.maxReasonable !== null && (
                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-amber-800">
                常见最高：
                                {formatCurrency(
                                    anomaly.maxReasonable,
                                )}
              </span>
                        )}

                        {anomaly.historicalMedian !== null && (
                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-amber-800">
                历史中位数：
                                {formatCurrency(
                                    anomaly.historicalMedian,
                                )}
              </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function cleanOptional(
    value: string,
): string | null {
    const cleaned = value.trim();

    return cleaned === "" ? null : cleaned;
}