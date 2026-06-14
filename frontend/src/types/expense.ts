export interface ExpenseCategory {
    id: number;
    code: string;
    nameZh: string;
    nameEn: string;
    parentId: number | null;
    icon: string | null;
    sortOrder: number;
}

export interface ExpenseRecord {
    id: number;
    categoryId: number;
    categoryCode: string;
    categoryName: string;
    batchId: number | null;
    itemName: string;
    merchant: string | null;
    amount: number;
    currency: string;
    quantity: number | null;
    unit: string | null;
    occurredAt: string;
    note: string | null;
    source: string;
    aiConfidence: number | null;
    anomalyLevel: string;
    anomalyScore: number | null;
    anomalyMessage: string | null;
    anomalyConfirmed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ExpensePageResponse {
    content: ExpenseRecord[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface ExpenseAnomaly {
    level: string;
    score: number;
    message: string | null;
    minReasonable: number | null;
    maxReasonable: number | null;
    historicalMedian: number | null;
    requiresConfirmation: boolean;
}

export interface ExpenseMutationResponse {
    saved: boolean;
    confirmationRequired: boolean;
    expense: ExpenseRecord | null;
    anomaly: ExpenseAnomaly | null;
}

export interface ExpenseClassificationResponse {
    categoryId: number;
    categoryCode: string;
    categoryName: string;
    confidence: number;
    reason: string | null;
    model: string;
}

export interface ExpensePayload {
    categoryId: number;
    itemName: string;
    merchant: string | null;
    amount: number;
    currency: string;
    quantity: number | null;
    unit: string | null;
    occurredAt: string;
    note: string | null;
    source: "MANUAL";
    rawText: string | null;
    confirmAnomaly: boolean;
}