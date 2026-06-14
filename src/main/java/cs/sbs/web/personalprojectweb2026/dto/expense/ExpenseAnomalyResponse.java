package cs.sbs.web.personalprojectweb2026.dto.expense;

import java.math.BigDecimal;

public record ExpenseAnomalyResponse(
        String level,
        BigDecimal score,
        String message,
        BigDecimal minReasonable,
        BigDecimal maxReasonable,
        BigDecimal historicalMedian
) {

    public boolean requiresConfirmation() {
        return "WARNING".equals(level);
    }
}