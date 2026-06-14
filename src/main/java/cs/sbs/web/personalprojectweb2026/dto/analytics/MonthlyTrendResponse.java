package cs.sbs.web.personalprojectweb2026.dto.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MonthlyTrendResponse(
        LocalDate month,
        BigDecimal amount) {
}