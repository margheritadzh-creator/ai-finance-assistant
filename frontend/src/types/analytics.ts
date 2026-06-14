export interface DashboardSummary {
    month: string;
    totalSpent: number;
    totalBudget: number;
    remainingBudget: number;
    budgetUsageRatio: number;
    expenseCount: number;
    anomalyCount: number;
    dailyAverage: number;
    topCategoryName: string | null;
    topCategoryAmount: number;
    nextMonthPrediction: number | null;
    financialHealthScore: number | null;
}

export interface BudgetItem {
    id: number;
    categoryId: number | null;
    categoryCode: string | null;
    categoryName: string;
    budgetMonth: string;
    limitAmount: number;
    alertRatio: number;
    spentAmount: number;
    remainingAmount: number;
    usageRatio: number;
    status: string;
}

export interface BudgetOverview {
    budgetMonth: string;
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    usageRatio: number;
    status: string;
    items: BudgetItem[];
}

export interface CategoryStatistics {
    categoryId: number;
    categoryCode: string;
    categoryName: string;
    amount: number;
    expenseCount: number;
    percentage: number;
}

export interface MonthlyTrend {
    month: string;
    amount: number;
}

export interface AnalyticsOverview {
    summary: DashboardSummary;
    budget: BudgetOverview;
    categoryStatistics: CategoryStatistics[];
    monthlyTrend: MonthlyTrend[];
}