package cs.sbs.web.personalprojectweb2026.dto.budget;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetItemResponse(
        Long id,
        Long categoryId,
        String categoryCode,
        String categoryName,
        LocalDate budgetMonth,
        BigDecimal limitAmount,
        BigDecimal alertRatio,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        BigDecimal usageRatio,
        String status
) {
}