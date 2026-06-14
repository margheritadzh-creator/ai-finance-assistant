package cs.sbs.web.personalprojectweb2026.dto.ai;

import cs.sbs.web.personalprojectweb2026.entity.SavingAdvice;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SavingAdviceResponse(
        Long id,
        LocalDate targetMonth,
        String title,
        String contentMarkdown,
        BigDecimal expectedSaving,
        String priority,
        String status,
        Instant createdAt
) {

    public static SavingAdviceResponse from(
            SavingAdvice advice
    ) {
        return new SavingAdviceResponse(
                advice.getId(),
                advice.getTargetMonth(),
                advice.getTitle(),
                advice.getContentMarkdown(),
                advice.getExpectedSaving(),
                advice.getPriority().name(),
                advice.getStatus().name(),
                advice.getCreatedAt()
        );
    }
}