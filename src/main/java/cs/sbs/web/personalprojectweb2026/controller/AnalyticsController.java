package cs.sbs.web.personalprojectweb2026.controller;

import cs.sbs.web.personalprojectweb2026.dto.analytics.AnalyticsOverviewResponse;
import cs.sbs.web.personalprojectweb2026.dto.analytics.ExpensePredictionResponse;
import cs.sbs.web.personalprojectweb2026.dto.analytics.FinancialHealthResponse;
import cs.sbs.web.personalprojectweb2026.service.analytics.AnalyticsService;
import cs.sbs.web.personalprojectweb2026.service.analytics.FinancialHealthService;
import cs.sbs.web.personalprojectweb2026.service.analytics.PredictionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final PredictionService predictionService;
    private final FinancialHealthService financialHealthService;

    public AnalyticsController(
            AnalyticsService analyticsService,
            PredictionService predictionService,
            FinancialHealthService financialHealthService
    ) {
        this.analyticsService = analyticsService;
        this.predictionService = predictionService;
        this.financialHealthService = financialHealthService;
    }

    @GetMapping("/overview")
    public AnalyticsOverviewResponse getOverview(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month
    ) {
        return analyticsService.getOverview(
                userId(jwt),
                month
        );
    }

    @PostMapping("/prediction")
    public ExpensePredictionResponse generatePrediction(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month
    ) {
        return predictionService.generatePrediction(
                userId(jwt),
                month
        );
    }

    @GetMapping("/prediction")
    public ExpensePredictionResponse getPrediction(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month
    ) {
        return predictionService.getPrediction(
                userId(jwt),
                month
        );
    }

    @PostMapping("/health-score")
    public FinancialHealthResponse calculateHealthScore(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month
    ) {
        return financialHealthService
                .calculateHealthScore(
                        userId(jwt),
                        month
                );
    }

    @GetMapping("/health-score")
    public FinancialHealthResponse getHealthScore(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month
    ) {
        return financialHealthService.getHealthScore(
                userId(jwt),
                month
        );
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}