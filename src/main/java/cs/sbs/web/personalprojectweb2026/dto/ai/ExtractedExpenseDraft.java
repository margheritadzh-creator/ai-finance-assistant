package cs.sbs.web.personalprojectweb2026.dto.ai;

import java.math.BigDecimal;
import java.time.Instant;

public record ExtractedExpenseDraft(
        Long categoryId,
        String categoryCode,
        String categoryName,
        String itemName,
        String merchant,
        BigDecimal amount,
        String currency,
        BigDecimal quantity,
        String unit,
        Instant occurredAt,
        String note,
        BigDecimal confidence,
        boolean requiresReview
) {
}