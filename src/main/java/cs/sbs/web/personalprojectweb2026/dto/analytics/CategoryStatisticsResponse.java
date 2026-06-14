package cs.sbs.web.personalprojectweb2026.dto.analytics;

import java.math.BigDecimal;

public record CategoryStatisticsResponse(
        Long categoryId,
        String categoryCode,
        String categoryName,
        BigDecimal amount,
        long expenseCount,
        BigDecimal percentage) {
}