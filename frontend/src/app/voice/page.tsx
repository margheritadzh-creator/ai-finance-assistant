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
  Check,
  FileText,
  LoaderCircle,
  Mic,
  MicOff,
  Plus,
  Save,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";

import { apiRequest, ApiError } from "@/lib/api";
import {
    clearAuth,
    getAccessToken,
} from "@/lib/auth-storage";
import {
    formatCurrency,
    toDateTimeLocalValue,
} from "@/lib/format";
import type { CurrentUser } from "@/types/auth";
import type {
    ExpenseCategory,
} from "@/types/expense";
import type {
    EditableExpenseDraft,
    EntrySource,
    ExpenseBatchIssue,
    ExpenseBatchPayload,
    ExpenseBatchResponse,
    ExpenseExtractionResponse,
} from "@/types/voice";

import {
    FinanceHeader,
} from "@/components/finance-header";

type RecognitionLanguage = "zh-CN" | "en-US";

interface SpeechAlternativeLike {
    transcript: string;
    confidence: number;
}

interface SpeechResultLike {
    readonly isFinal: boolean;
    readonly length: number;
    readonly [index: number]: SpeechAlternativeLike;
}

interface SpeechResultListLike {
    readonly length: number;
    readonly [index: number]: SpeechResultLike;
}

interface SpeechRecognitionEventLike extends Event {
    readonly resultIndex: number;
    readonly results: SpeechResultListLike;
}

interface SpeechRecognitionErrorEventLike
    extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;

    onstart:
        | (() => void)
        | null;

    onend:
        | (() => void)
        | null;

    onresult:
        | ((
        event: SpeechRecognitionEventLike,
    ) => void)
        | null;

    onerror:
        | ((
        event: SpeechRecognitionErrorEventLike,
    ) => void)
        | null;

    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionConstructor {
    new (): SpeechRecognitionLike;
}

type SpeechWindow = Window &
    typeof globalThis & {
    SpeechRecognition?:
        SpeechRecognitionConstructor;

    webkitSpeechRecognition?:
        SpeechRecognitionConstructor;
};

export default function VoiceEntryPage() {
    const router = useRouter();

    const recognitionRef =
        useRef<SpeechRecognitionLike | null>(null);

    const originalTextRef = useRef("");

    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [categories, setCategories] = useState<
        ExpenseCategory[]
    >([]);

    const [language, setLanguage] =
        useState<RecognitionLanguage>("zh-CN");

    const [source, setSource] =
        useState<EntrySource>("TEXT");

    const [inputText, setInputText] =
        useState("");

    const [drafts, setDrafts] = useState<
        EditableExpenseDraft[]
    >([]);

    const [batchIssues, setBatchIssues] =
        useState<ExpenseBatchIssue[]>([]);

    const [pendingPayload, setPendingPayload] =
        useState<ExpenseBatchPayload | null>(null);

    const [loading, setLoading] = useState(true);
    const [listening, setListening] =
        useState(false);

    const [extracting, setExtracting] =
        useState(false);

    const [saving, setSaving] = useState(false);

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

        try {
            const [currentUser, categoryList] =
                await Promise.all([
                    apiRequest<CurrentUser>(
                        "/api/auth/me",
                    ),
                    apiRequest<ExpenseCategory[]>(
                        "/api/categories",
                    ),
                ]);

            setUser(currentUser);
            setCategories(categoryList);
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
                    : "页面加载失败",
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

    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    function startRecognition() {
        setErrorMessage("");
        setSuccessMessage("");

        const speechWindow =
            window as SpeechWindow;

        const Recognition =
            speechWindow.SpeechRecognition ??
            speechWindow.webkitSpeechRecognition;

        if (!Recognition) {
            setErrorMessage(
                "当前浏览器不支持语音识别，请使用最新版 Chrome，或直接输入文字。",
            );
            return;
        }

        recognitionRef.current?.abort();

        const recognition = new Recognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        originalTextRef.current =
            inputText.trim();

        recognition.onstart = () => {
            setListening(true);
            setSource("VOICE");
        };

        recognition.onresult = (event) => {
            let recognizedText = "";

            for (
                let index = 0;
                index < event.results.length;
                index++
            ) {
                const result =
                    event.results[index];

                const transcript =
                    result?.[0]?.transcript ?? "";

                recognizedText += transcript;
            }

            const originalText =
                originalTextRef.current;

            setInputText(
                [originalText, recognizedText.trim()]
                    .filter(Boolean)
                    .join(originalText ? " " : ""),
            );
        };

        recognition.onerror = (event) => {
            if (event.error === "aborted") {
                return;
            }

            setListening(false);
            setErrorMessage(
                translateSpeechError(event.error),
            );
        };

        recognition.onend = () => {
            setListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch {
            setListening(false);
            setErrorMessage(
                "语音识别启动失败，请稍后重试。",
            );
        }
    }

    function stopRecognition() {
        recognitionRef.current?.stop();
        setListening(false);
    }

    async function extractExpenses() {
        const text = inputText.trim();

        if (!text) {
            setErrorMessage(
                "请先输入或识别消费内容。",
            );
            return;
        }

        stopRecognition();

        setExtracting(true);
        setErrorMessage("");
        setSuccessMessage("");
        setBatchIssues([]);
        setPendingPayload(null);

        try {
            const response =
                await apiRequest<ExpenseExtractionResponse>(
                    "/api/ai/expenses/extract",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            userText: text,
                            inputLanguage: language,
                        }),
                    },
                );

            setDrafts(
                response.expenses.map((expense) => ({
                    clientId: createClientId(),
                    categoryId: String(
                        expense.categoryId,
                    ),
                    categoryCode:
                    expense.categoryCode,
                    itemName: expense.itemName,
                    merchant:
                        expense.merchant ?? "",
                    amount: String(expense.amount),
                    quantity:
                        expense.quantity === null
                            ? ""
                            : String(expense.quantity),
                    unit: expense.unit ?? "",
                    occurredAt:
                        toDateTimeLocalValue(
                            expense.occurredAt,
                        ),
                    note: expense.note ?? "",
                    confidence: Number(
                        expense.confidence,
                    ),
                    requiresReview:
                    expense.requiresReview,
                })),
            );

            setSuccessMessage(
                `已识别出${response.itemCount}条消费记录，请确认后保存。`,
            );
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "智能解析失败，请稍后重试。",
            );
        } finally {
            setExtracting(false);
        }
    }

    function updateDraft(
        index: number,
        patch: Partial<EditableExpenseDraft>,
    ) {
        setDrafts((current) =>
            current.map((draft, draftIndex) =>
                draftIndex === index
                    ? {
                        ...draft,
                        ...patch,
                        requiresReview: false,
                    }
                    : draft,
            ),
        );

        setBatchIssues([]);
        setPendingPayload(null);
    }

    function removeDraft(index: number) {
        setDrafts((current) =>
            current.filter(
                (_, draftIndex) =>
                    draftIndex !== index,
            ),
        );

        setBatchIssues([]);
        setPendingPayload(null);
    }

    function addEmptyDraft() {
        const otherCategory =
            categories.find(
                (category) =>
                    category.code === "OTHER",
            ) ?? categories[0];

        if (!otherCategory) {
            setErrorMessage(
                "没有可用的消费分类。",
            );
            return;
        }

        setDrafts((current) => [
            ...current,
            {
                clientId: createClientId(),
                categoryId: String(
                    otherCategory.id,
                ),
                categoryCode:
                otherCategory.code,
                itemName: "",
                merchant: "",
                amount: "",
                quantity: "",
                unit: "",
                occurredAt:
                    toDateTimeLocalValue(),
                note: "",
                confidence: 1,
                requiresReview: true,
            },
        ]);
    }

    async function saveBatch(
        confirmAnomalies = false,
    ) {
        setErrorMessage("");
        setSuccessMessage("");

        let payload: ExpenseBatchPayload;

        if (
            confirmAnomalies &&
            pendingPayload
        ) {
            payload = {
                ...pendingPayload,
                confirmAnomalies: true,
            };
        } else {
            const validationError =
                validateDrafts(drafts);

            if (validationError) {
                setErrorMessage(validationError);
                return;
            }

            payload = {
                source,
                inputLanguage: language,
                originalText:
                    inputText.trim(),
                confirmAnomalies: false,
                expenses: drafts.map(
                    (draft) => ({
                        categoryId: Number(
                            draft.categoryId,
                        ),
                        itemName:
                            draft.itemName.trim(),
                        merchant:
                            cleanOptional(
                                draft.merchant,
                            ),
                        amount: Number(
                            draft.amount,
                        ),
                        currency: "CNY",
                        quantity:
                            draft.quantity.trim() === ""
                                ? null
                                : Number(
                                    draft.quantity,
                                ),
                        unit:
                            cleanOptional(draft.unit),
                        occurredAt: new Date(
                            draft.occurredAt,
                        ).toISOString(),
                        note:
                            cleanOptional(draft.note),
                        source,
                        rawText:
                            inputText.trim() || null,
                        confirmAnomaly: false,
                    }),
                ),
            };
        }

        setSaving(true);

        try {
            const response =
                await apiRequest<ExpenseBatchResponse>(
                    "/api/expenses/batch",
                    {
                        method: "POST",
                        body: JSON.stringify(payload),
                    },
                );

            if (
                response.confirmationRequired
            ) {
                setBatchIssues(
                    response.issues ?? [],
                );
                setPendingPayload(payload);
                return;
            }

            if (!response.saved) {
                setErrorMessage(
                    "账单保存失败，请稍后重试。",
                );
                return;
            }

            setSuccessMessage(
                `已成功保存${response.itemCount}条账单。`,
            );

            setDrafts([]);
            setBatchIssues([]);
            setPendingPayload(null);
            setInputText("");
            setSource("TEXT");
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "批量保存失败，请稍后重试。",
            );
        } finally {
            setSaving(false);
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
                    正在加载记账页面
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <div className="finance-surface rounded-[24px] p-8 text-center">
                    <p className="text-[#4a5568]">
                        {errorMessage ||
                            "暂时无法加载页面"}
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
                        智能记账
                    </p>

                    <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.045em] text-[#111827]">
                        文字与语音记账
                    </h1>

                    <p className="mt-3 text-[15px] text-[#747d8d]">
                        说出或输入多笔消费，系统会自动拆分、分类并生成可编辑账单。
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

                <section className="mt-7 grid gap-6 xl:grid-cols-[0.83fr_1.17fr]">
                    <article className="finance-surface rounded-[25px] p-6 sm:p-7">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f4ead8] text-[#9b733a]">
                                <FileText size={20} />
                            </div>

                            <div>
                                <p className="font-semibold text-[#273147]">
                                    输入消费内容
                                </p>

                                <p className="mt-1 text-xs text-[#9299a5]">
                                    识别完成后仍可手动修改文字
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#344054]">
                  语音识别语言
                </span>

                                <select
                                    value={language}
                                    onChange={(event) =>
                                        setLanguage(
                                            event.target
                                                .value as RecognitionLanguage,
                                        )
                                    }
                                    disabled={listening}
                                    className="finance-input"
                                >
                                    <option value="zh-CN">
                                        中文（普通话）
                                    </option>

                                    <option value="en-US">
                                        英语
                                    </option>
                                </select>
                            </label>
                        </div>

                        <div className="mt-5">
                            <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#344054]">
                  消费内容
                </span>

                                <textarea
                                    value={inputText}
                                    onChange={(event) => {
                                        setInputText(
                                            event.target.value,
                                        );
                                        setSource("TEXT");
                                    }}
                                    rows={10}
                                    placeholder="例如：今天午饭35元，坐地铁花了4元，晚上买了一本68元的书。"
                                    className="w-full resize-none rounded-[17px] border border-[#dce1e8] bg-white px-4 py-4 text-sm leading-7 text-[#111827] outline-none transition placeholder:text-[#a1a8b3] focus:border-[#c4a36a] focus:ring-4 focus:ring-[#c4a36a]/15"
                                />
                            </label>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={
                                    listening
                                        ? stopRecognition
                                        : startRecognition
                                }
                                className={[
                                    "flex h-12 items-center justify-center gap-2 rounded-[15px] border text-sm font-semibold transition",
                                    listening
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-[#d7c6aa] bg-[#f7f0e3] text-[#8a642f] hover:bg-[#f2e5cf]",
                                ].join(" ")}
                            >
                                {listening ? (
                                    <>
                                        <MicOff size={18} />
                                        停止语音识别
                                    </>
                                ) : (
                                    <>
                                        <Mic size={18} />
                                        开始语音识别
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void extractExpenses()
                                }
                                disabled={
                                    extracting ||
                                    !inputText.trim()
                                }
                                className="finance-primary-button"
                            >
                                {extracting ? (
                                    <>
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                        正在解析
                                    </>
                                ) : (
                                    <>
                                        <WandSparkles size={17} />
                                        智能拆分账单
                                    </>
                                )}
                            </button>
                        </div>

                        {listening && (
                            <div className="mt-4 flex items-center gap-3 rounded-[15px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>

                                正在听取语音，请开始说话
                            </div>
                        )}

                        <div className="mt-6 rounded-[17px] border border-[#e5e7eb] bg-[#f8f8f7] p-4">
                            <p className="text-xs font-medium text-[#657080]">
                                输入示例
                            </p>

                            <p className="mt-2 text-sm leading-6 text-[#8a92a0]">
                                今天早餐12元，地铁4元，中午在学校吃饭花了32元，晚上买电影票45元。
                            </p>
                        </div>
                    </article>

                    <article className="finance-surface rounded-[25px] p-6 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#e9eef8] text-[#34548a]">
                                    <Sparkles size={20} />
                                </div>

                                <div>
                                    <p className="font-semibold text-[#273147]">
                                        账单确认
                                    </p>

                                    <p className="mt-1 text-xs text-[#9299a5]">
                                        共{drafts.length}条待保存记录
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addEmptyDraft}
                                className="finance-secondary-button"
                            >
                                <Plus size={15} />
                                手动添加一条
                            </button>
                        </div>

                        {drafts.length === 0 ? (
                            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f4ead8] text-[#9b733a]">
                                    <WandSparkles size={27} />
                                </div>

                                <p className="mt-5 font-semibold text-[#344054]">
                                    尚未生成账单
                                </p>

                                <p className="mt-2 max-w-sm text-sm leading-6 text-[#8b93a0]">
                                    在左侧输入消费内容并点击“智能拆分账单”，识别结果会显示在这里。
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 space-y-5">
                                {drafts.map(
                                    (draft, index) => (
                                        <DraftEditor
                                            key={draft.clientId}
                                            index={index}
                                            draft={draft}
                                            categories={categories}
                                            onChange={(patch) =>
                                                updateDraft(
                                                    index,
                                                    patch,
                                                )
                                            }
                                            onRemove={() =>
                                                removeDraft(index)
                                            }
                                        />
                                    ),
                                )}

                                {batchIssues.length > 0 && (
                                    <BatchWarning
                                        issues={batchIssues}
                                    />
                                )}

                                <div className="flex flex-col gap-3 border-t border-[#e5e7eb] pt-5 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs leading-5 text-[#8b93a0]">
                                        保存后将自动更新账单列表、财务总览和消费趋势。
                                    </p>

                                    {batchIssues.length > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void saveBatch(true)
                                            }
                                            disabled={saving}
                                            className="finance-primary-button sm:w-auto sm:min-w-[190px]"
                                        >
                                            {saving ? (
                                                <LoaderCircle
                                                    size={17}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <AlertTriangle
                                                    size={17}
                                                />
                                            )}

                                            确认异常并保存
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void saveBatch()
                                            }
                                            disabled={
                                                saving ||
                                                drafts.length === 0
                                            }
                                            className="finance-primary-button sm:w-auto sm:min-w-[170px]"
                                        >
                                            {saving ? (
                                                <LoaderCircle
                                                    size={17}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Save size={17} />
                                            )}

                                            批量保存账单
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </article>
                </section>
            </div>
        </main>
    );
}

interface DraftEditorProps {
    index: number;
    draft: EditableExpenseDraft;
    categories: ExpenseCategory[];
    onChange: (
        patch: Partial<EditableExpenseDraft>,
    ) => void;
    onRemove: () => void;
}

function DraftEditor({
                         index,
                         draft,
                         categories,
                         onChange,
                         onRemove,
                     }: DraftEditorProps) {
    const confidence = Math.round(
        draft.confidence * 100,
    );

    return (
        <div className="rounded-[20px] border border-[#e2e4e8] bg-[#fbfaf7] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#273147]">
                            第{index + 1}条账单
                        </p>

                        {draft.requiresReview && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                建议检查
              </span>
                        )}

                        <span className="rounded-full bg-[#eef1f5] px-2.5 py-1 text-[11px] text-[#758092]">
              识别可信度{confidence}%
            </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRemove}
                    className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                    aria-label="删除此条账单"
                >
                    <Trash2 size={15} />
                </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <DraftField
                    label="消费项目"
                    className="sm:col-span-2"
                >
                    <input
                        value={draft.itemName}
                        onChange={(event) =>
                            onChange({
                                itemName:
                                event.target.value,
                            })
                        }
                        className="finance-input"
                        placeholder="消费项目"
                    />
                </DraftField>

                <DraftField label="消费分类">
                    <select
                        value={draft.categoryId}
                        onChange={(event) => {
                            const category =
                                categories.find(
                                    (item) =>
                                        String(item.id) ===
                                        event.target.value,
                                );

                            onChange({
                                categoryId:
                                event.target.value,
                                categoryCode:
                                    category?.code ?? "",
                            });
                        }}
                        className="finance-input"
                    >
                        {categories.map((category) => (
                            <option
                                key={category.id}
                                value={category.id}
                            >
                                {category.nameZh}
                            </option>
                        ))}
                    </select>
                </DraftField>

                <DraftField label="消费金额">
                    <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center border-r border-[#e5e7eb] text-sm font-medium text-[#9b733a]">
              ¥
            </span>

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            value={draft.amount}
                            onChange={(event) =>
                                onChange({
                                    amount:
                                    event.target.value,
                                })
                            }
                            className="finance-input"
                            style={{
                                paddingLeft: "3.5rem",
                            }}
                        />
                    </div>
                </DraftField>

                <DraftField label="商家名称">
                    <input
                        value={draft.merchant}
                        onChange={(event) =>
                            onChange({
                                merchant:
                                event.target.value,
                            })
                        }
                        className="finance-input"
                        placeholder="选填"
                    />
                </DraftField>

                <DraftField label="消费时间">
                    <input
                        type="datetime-local"
                        value={draft.occurredAt}
                        onChange={(event) =>
                            onChange({
                                occurredAt:
                                event.target.value,
                            })
                        }
                        className="finance-input"
                    />
                </DraftField>

                <DraftField label="数量">
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={draft.quantity}
                        onChange={(event) =>
                            onChange({
                                quantity:
                                event.target.value,
                            })
                        }
                        className="finance-input"
                        placeholder="选填"
                    />
                </DraftField>

                <DraftField label="单位">
                    <input
                        value={draft.unit}
                        onChange={(event) =>
                            onChange({
                                unit:
                                event.target.value,
                            })
                        }
                        className="finance-input"
                        placeholder="例如：份、杯、公斤"
                    />
                </DraftField>

                <DraftField
                    label="备注"
                    className="sm:col-span-2"
                >
          <textarea
              value={draft.note}
              onChange={(event) =>
                  onChange({
                      note:
                      event.target.value,
                  })
              }
              rows={3}
              placeholder="选填"
              className="w-full resize-none rounded-[15px] border border-[#dce1e8] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#a1a8b3] focus:border-[#c4a36a] focus:ring-4 focus:ring-[#c4a36a]/15"
          />
                </DraftField>
            </div>
        </div>
    );
}

interface DraftFieldProps {
    label: string;
    className?: string;
    children: ReactNode;
}

function DraftField({
                        label,
                        className = "",
                        children,
                    }: DraftFieldProps) {
    return (
        <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-medium text-[#596273]">
        {label}
      </span>

            {children}
        </label>
    );
}

function BatchWarning({
                          issues,
                      }: {
    issues: ExpenseBatchIssue[];
}) {
    return (
        <div className="rounded-[18px] border border-amber-300 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-3">
                <AlertTriangle
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                    <p className="font-semibold text-amber-900">
                        部分金额可能异常
                    </p>

                    <p className="mt-2 text-sm leading-6 text-amber-800">
                        请确认下面的账单金额、数量和单位是否填写正确。
                    </p>

                    <div className="mt-3 space-y-2">
                        {issues.map((issue) => (
                            <div
                                key={`${issue.index}-${issue.itemName}`}
                                className="rounded-[12px] bg-white/75 px-3 py-2 text-sm text-amber-800"
                            >
                                第{issue.index + 1}条“
                                {issue.itemName}”：
                                {issue.anomaly.message ??
                                    "金额超出常见范围"}

                                {issue.anomaly
                                    .maxReasonable !== null && (
                                    <span className="ml-2 text-xs">
                    常见最高约
                                        {formatCurrency(
                                            issue.anomaly
                                                .maxReasonable,
                                        )}
                  </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function validateDrafts(
    drafts: EditableExpenseDraft[],
): string | null {
    if (drafts.length === 0) {
        return "请至少保留一条账单。";
    }

    for (
        let index = 0;
        index < drafts.length;
        index++
    ) {
        const draft = drafts[index];

        if (!draft.itemName.trim()) {
            return `第${index + 1}条账单缺少消费项目。`;
        }

        if (
            !draft.categoryId ||
            Number(draft.categoryId) <= 0
        ) {
            return `第${index + 1}条账单未选择消费分类。`;
        }

        const amount = Number(
            draft.amount,
        );

        if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > 99999999.99
        ) {
            return `第${index + 1}条账单金额不正确。`;
        }

        if (draft.quantity.trim()) {
            const quantity = Number(
                draft.quantity,
            );

            if (
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {
                return `第${index + 1}条账单数量不正确。`;
            }
        }

        const occurredAt = new Date(
            draft.occurredAt,
        );

        if (
            Number.isNaN(
                occurredAt.getTime(),
            )
        ) {
            return `第${index + 1}条账单消费时间不正确。`;
        }

        if (
            occurredAt.getTime() >
            Date.now() + 60_000
        ) {
            return `第${index + 1}条账单消费时间不能晚于当前时间。`;
        }
    }

    return null;
}

function cleanOptional(
    value: string,
): string | null {
    const cleaned = value.trim();

    return cleaned || null;
}

function createClientId(): string {
    if (
        typeof crypto !== "undefined" &&
        "randomUUID" in crypto
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
}

function translateSpeechError(
    error: string,
): string {
    switch (error) {
        case "not-allowed":
        case "service-not-allowed":
            return "浏览器没有获得麦克风权限，请在地址栏旁的权限设置中允许使用麦克风。";

        case "no-speech":
            return "没有检测到语音，请靠近麦克风后重试。";

        case "audio-capture":
            return "无法使用麦克风，请检查设备或系统权限。";

        case "network":
            return "语音识别网络连接失败，请检查网络后重试。";

        default:
            return "语音识别失败，请稍后重试。";
    }
}