package cs.sbs.web.personalprojectweb2026.dto.expense;

import cs.sbs.web.personalprojectweb2026.entity.ExpenseRecord;

import java.math.BigDecimal;
import java.time.Instant;

public record ExpenseResponse(
        Long id,
        Long categoryId,
        String categoryCode,
        String categoryName,
        Long batchId,
        String itemName,
        String merchant,
        BigDecimal amount,
        String currency,
        BigDecimal quantity,
        String unit,
        Instant occurredAt,
        String note,
        String source,
        BigDecimal aiConfidence,
        String anomalyLevel,
        BigDecimal anomalyScore,
        String anomalyMessage,
        boolean anomalyConfirmed,
        Instant createdAt,
        Instant updatedAt
) {

    public static ExpenseResponse from(ExpenseRecord expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getCategory().getId(),
                expense.getCategory().getCode(),
                expense.getCategory().getNameZh(),
                expense.getBatch() == null
                        ? null
                        : expense.getBatch().getId(),
                expense.getItemName(),
                expense.getMerchant(),
                expense.getAmount(),
                expense.getCurrency(),
                expense.getQuantity(),
                expense.getUnit(),
                expense.getOccurredAt(),
                expense.getNote(),
                expense.getSource().name(),
                expense.getAiConfidence(),
                expense.getAnomalyLevel().name(),
                expense.getAnomalyScore(),
                expense.getAnomalyMessage(),
                expense.isAnomalyConfirmed(),
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );
    }
}