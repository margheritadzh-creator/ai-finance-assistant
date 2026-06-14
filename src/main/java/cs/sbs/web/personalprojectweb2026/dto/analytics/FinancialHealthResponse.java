package cs.sbs.web.personalprojectweb2026.dto.analytics;

import cs.sbs.web.personalprojectweb2026.entity.FinancialHealthScore;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

public record FinancialHealthResponse(
        Long id,
        LocalDate scoreMonth,
        BigDecimal totalScore,
        BigDecimal budgetScore,
        BigDecimal stabilityScore,
        BigDecimal savingScore,
        BigDecimal structureScore,
        BigDecimal riskScore,
        String level,
        Map<String, Object> detail,
        Instant generatedAt
) {

    public static FinancialHealthResponse from(
            FinancialHealthScore score) {
        return new FinancialHealthResponse(
                score.getId(),
                score.getScoreMonth(),
                score.getTotalScore(),
                score.getBudgetScore(),
                score.getStabilityScore(),
                score.getSavingScore(),
                score.getStructureScore(),
                score.getRiskScore(),
                score.getLevel().name(),
                score.getDetail(),
                score.getCreatedAt()
        );
    }
}