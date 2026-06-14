export type SavingAdviceStatus =
    | "ACTIVE"
    | "ADOPTED"
    | "DISMISSED";

export type SavingAdvicePriority =
    | "LOW"
    | "MEDIUM"
    | "HIGH";

export interface SavingAdvice {
    id: number;
    targetMonth: string;
    title: string;
    contentMarkdown: string;
    expectedSaving: number | null;
    priority: SavingAdvicePriority;
    status: SavingAdviceStatus;
    createdAt: string;
}