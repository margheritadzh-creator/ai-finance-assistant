package cs.sbs.web.personalprojectweb2026.dto.budget;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BudgetOverviewResponse(
        LocalDate budgetMonth,
        BigDecimal totalBudget,
        BigDecimal totalSpent,
        BigDecimal remainingBudget,
        BigDecimal usageRatio,
        String status,
        List<BudgetItemResponse> items
) {
}