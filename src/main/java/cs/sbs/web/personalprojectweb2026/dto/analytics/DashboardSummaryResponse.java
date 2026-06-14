package cs.sbs.web.personalprojectweb2026.dto.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardSummaryResponse(
        LocalDate month,
        BigDecimal totalSpent,
        BigDecimal totalBudget,
        BigDecimal remainingBudget,
        BigDecimal budgetUsageRatio,
        long expenseCount,
        long anomalyCount,
        BigDecimal dailyAverage,
        String topCategoryName,
        BigDecimal topCategoryAmount,
        BigDecimal nextMonthPrediction,
        BigDecimal financialHealthScore
) {
}