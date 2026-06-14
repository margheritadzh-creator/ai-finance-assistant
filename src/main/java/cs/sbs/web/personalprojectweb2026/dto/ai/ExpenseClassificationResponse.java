package cs.sbs.web.personalprojectweb2026.dto.ai;

import java.math.BigDecimal;

public record ExpenseClassificationResponse(
        Long categoryId,
        String categoryCode,
        String categoryName,
        BigDecimal confidence,
        String reason,
        String model
) {
}