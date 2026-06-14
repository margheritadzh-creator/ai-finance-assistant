import type {
    ExpenseAnomaly,
    ExpenseRecord,
} from "@/types/expense";

export type EntrySource = "TEXT" | "VOICE";

export interface ExtractedExpenseDraft {
    categoryId: number;
    categoryCode: string;
    categoryName: string;
    itemName: string;
    merchant: string | null;
    amount: number;
    currency: string;
    quantity: number | null;
    unit: string | null;
    occurredAt: string;
    note: string | null;
    confidence: number;
    requiresReview: boolean;
}

export interface ExpenseExtractionResponse {
    originalText: string;
    inputLanguage: string;
    model: string;
    promptVersion: number;
    itemCount: number;
    expenses: ExtractedExpenseDraft[];
}

export interface EditableExpenseDraft {
    clientId: string;
    categoryId: string;
    categoryCode: string;
    itemName: string;
    merchant: string;
    amount: string;
    quantity: string;
    unit: string;
    occurredAt: string;
    note: string;
    confidence: number;
    requiresReview: boolean;
}

export interface BatchExpensePayload {
    categoryId: number;
    itemName: string;
    merchant: string | null;
    amount: number;
    currency: string;
    quantity: number | null;
    unit: string | null;
    occurredAt: string;
    note: string | null;
    source: EntrySource;
    rawText: string | null;
    confirmAnomaly: boolean;
}

export interface ExpenseBatchPayload {
    source: EntrySource;
    inputLanguage: "zh-CN" | "en-US";
    originalText: string;
    confirmAnomalies: boolean;
    expenses: BatchExpensePayload[];
}

export interface ExpenseBatchIssue {
    index: number;
    itemName: string;
    anomaly: ExpenseAnomaly;
}

export interface ExpenseBatchResponse {
    saved: boolean;
    confirmationRequired: boolean;
    batchId: number | null;
    itemCount: number;
    expenses: ExpenseRecord[];
    issues: ExpenseBatchIssue[];
}