package cs.sbs.web.personalprojectweb2026.dto.analytics;

import cs.sbs.web.personalprojectweb2026.entity.MonthlyPrediction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ExpensePredictionResponse(
        Long id,
        LocalDate targetMonth,
        BigDecimal predictedAmount,
        BigDecimal lowerBound,
        BigDecimal upperBound,
        String algorithm,
        String modelVersion,
        int basedOnMonths,
        String explanation,
        Instant generatedAt
) {

    public static ExpensePredictionResponse from(
            MonthlyPrediction prediction
    ) {
        return new ExpensePredictionResponse(
                prediction.getId(),
                prediction.getTargetMonth(),
                prediction.getPredictedAmount(),
                prediction.getLowerBound(),
                prediction.getUpperBound(),
                prediction.getAlgorithm().name(),
                prediction.getModelVersion(),
                prediction.getBasedOnMonths(),
                prediction.getExplanation(),
                prediction.getGeneratedAt()
        );
    }
}