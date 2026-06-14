package cs.sbs.web.personalprojectweb2026.dto.analytics;

import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetOverviewResponse;

import java.util.List;

public record AnalyticsOverviewResponse(
        DashboardSummaryResponse summary,
        BudgetOverviewResponse budget,
        List<CategoryStatisticsResponse> categoryStatistics,
        List<MonthlyTrendResponse> monthlyTrend
) {
}