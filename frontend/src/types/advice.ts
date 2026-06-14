export interface SavingAdvice {
    id: number;
    targetMonth: string;
    title: string;
    contentMarkdown: string;
    expectedSaving: number | null;
    priority: string;
    status: string;
    createdAt: string;
}