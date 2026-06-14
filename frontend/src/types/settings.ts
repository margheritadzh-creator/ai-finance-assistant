export type SpendingLevel =
    | "ECONOMICAL"
    | "STANDARD"
    | "COMFORTABLE"
    | "PREMIUM"
    | "CUSTOM";

export type WarningLevel =
    | "LOW"
    | "MEDIUM"
    | "HIGH";

export type LanguageCode =
    | "zh-CN"
    | "en-US";

export interface UserPreference {
    id: number;
    userId: number;
    regionCode: string;
    regionName: string;
    priceIndex: number;
    spendingLevel: SpendingLevel;
    monthlyIncome: number | null;
    defaultMonthlyBudget: number | null;
    warningEnabled: boolean;
    warningLevel: WarningLevel;
    preferredLanguage: LanguageCode;
    speechLanguage: LanguageCode;
    currency: string;
}

export interface UserPreferenceUpdatePayload {
    regionCode: string;
    regionName: string;
    priceIndex: number;
    spendingLevel: SpendingLevel;
    monthlyIncome: number | null;
    defaultMonthlyBudget: number | null;
    warningEnabled: boolean;
    warningLevel: WarningLevel;
    preferredLanguage: LanguageCode;
    speechLanguage: LanguageCode;
    currency: "CNY";
}

export interface BudgetUpsertPayload {
    categoryId: number | null;
    budgetMonth: string;
    limitAmount: number;
    alertRatio: number;
}