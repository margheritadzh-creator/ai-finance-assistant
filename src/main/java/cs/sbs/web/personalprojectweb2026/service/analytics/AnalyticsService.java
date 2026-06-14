package cs.sbs.web.personalprojectweb2026.service.analytics;

import cs.sbs.web.personalprojectweb2026.dto.analytics.AnalyticsOverviewResponse;
import cs.sbs.web.personalprojectweb2026.dto.analytics.CategoryStatisticsResponse;
import cs.sbs.web.personalprojectweb2026.dto.analytics.DashboardSummaryResponse;
import cs.sbs.web.personalprojectweb2026.dto.analytics.MonthlyTrendResponse;
import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetOverviewResponse;
import cs.sbs.web.personalprojectweb2026.entity.enums.ExpenseAnomalyLevel;
import cs.sbs.web.personalprojectweb2026.repository.ExpenseRecordRepository;
import cs.sbs.web.personalprojectweb2026.repository.FinancialHealthScoreRepository;
import cs.sbs.web.personalprojectweb2026.repository.MonthlyPredictionRepository;
import cs.sbs.web.personalprojectweb2026.service.BudgetService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class AnalyticsService {

    private static final ZoneId ZONE_ID =
            ZoneId.of("Asia/Shanghai");

    private final ExpenseRecordRepository expenseRecordRepository;
    private final MonthlyPredictionRepository predictionRepository;
    private final FinancialHealthScoreRepository healthScoreRepository;
    private final BudgetService budgetService;

    public AnalyticsService(
            ExpenseRecordRepository expenseRecordRepository,
            MonthlyPredictionRepository predictionRepository,
            FinancialHealthScoreRepository healthScoreRepository,
            BudgetService budgetService
    ) {
        this.expenseRecordRepository = expenseRecordRepository;
        this.predictionRepository = predictionRepository;
        this.healthScoreRepository = healthScoreRepository;
        this.budgetService = budgetService;
    }

    @Transactional(readOnly = true)
    public AnalyticsOverviewResponse getOverview(
            Long userId,
            LocalDate requestedMonth
    ) {
        LocalDate month = normalizeMonth(requestedMonth);
        MonthWindow window = monthWindow(month);

        BudgetOverviewResponse budget =
                budgetService.getOverview(userId, month);

        List<Object[]> categoryRows =
                expenseRecordRepository
                        .summarizeByCategoryForPeriod(
                                userId,
                                window.start(),
                                window.end()
                        );

        BigDecimal totalSpent = zeroIfNull(
                expenseRecordRepository.sumAmountForPeriod(
                        userId,
                        window.start(),
                        window.end()
                )
        );

        List<CategoryStatisticsResponse> categoryStatistics =
                mapCategoryStatistics(
                        categoryRows,
                        totalSpent
                );

        long expenseCount =
                expenseRecordRepository
                        .countByUser_IdAndOccurredAtGreaterThanEqualAndOccurredAtLessThan(
                                userId,
                                window.start(),
                                window.end()
                        );

        long anomalyCount =
                expenseRecordRepository.countAnomaliesForPeriod(
                        userId,
                        window.start(),
                        window.end(),
                        ExpenseAnomalyLevel.NONE
                );

        CategoryStatisticsResponse topCategory =
                categoryStatistics.isEmpty()
                        ? null
                        : categoryStatistics.getFirst();

        BigDecimal prediction = predictionRepository
                .findFirstByUser_IdAndTargetMonthOrderByGeneratedAtDesc(
                        userId,
                        month.plusMonths(1)
                )
                .map(value -> value.getPredictedAmount())
                .orElse(null);

        BigDecimal healthScore = healthScoreRepository
                .findByUser_IdAndScoreMonth(userId, month)
                .map(value -> value.getTotalScore())
                .orElse(null);

        DashboardSummaryResponse summary =
                new DashboardSummaryResponse(
                        month,
                        scaleMoney(totalSpent),
                        budget.totalBudget(),
                        budget.remainingBudget(),
                        budget.usageRatio(),
                        expenseCount,
                        anomalyCount,
                        calculateDailyAverage(
                                totalSpent,
                                month
                        ),
                        topCategory == null
                                ? null
                                : topCategory.categoryName(),
                        topCategory == null
                                ? BigDecimal.ZERO.setScale(2)
                                : topCategory.amount(),
                        prediction == null
                                ? null
                                : scaleMoney(prediction),
                        healthScore
                );

        return new AnalyticsOverviewResponse(
                summary,
                budget,
                categoryStatistics,
                createMonthlyTrend(userId, month, 6)
        );
    }

    private List<CategoryStatisticsResponse> mapCategoryStatistics(
            List<Object[]> rows,
            BigDecimal totalSpent
    ) {
        List<CategoryStatisticsResponse> result =
                new ArrayList<>();

        for (Object[] row : rows) {
            BigDecimal amount = zeroIfNull(
                    (BigDecimal) row[3]
            );

            long count = ((Number) row[4]).longValue();

            BigDecimal percentage =
                    totalSpent.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO.setScale(2)
                            : amount.divide(
                                    totalSpent,
                                    4,
                                    RoundingMode.HALF_UP
                            )
                            .multiply(
                                    new BigDecimal("100")
                            )
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            );

            result.add(
                    new CategoryStatisticsResponse(
                            ((Number) row[0]).longValue(),
                            (String) row[1],
                            (String) row[2],
                            scaleMoney(amount),
                            count,
                            percentage
                    )
            );
        }

        return result;
    }

    private List<MonthlyTrendResponse> createMonthlyTrend(
            Long userId,
            LocalDate endingMonth,
            int monthCount
    ) {
        List<MonthlyTrendResponse> result =
                new ArrayList<>();

        LocalDate firstMonth =
                endingMonth.minusMonths(monthCount - 1L);

        for (int index = 0; index < monthCount; index++) {
            LocalDate month =
                    firstMonth.plusMonths(index);

            MonthWindow window = monthWindow(month);

            BigDecimal amount = zeroIfNull(
                    expenseRecordRepository.sumAmountForPeriod(
                            userId,
                            window.start(),
                            window.end()
                    )
            );

            result.add(
                    new MonthlyTrendResponse(
                            month,
                            scaleMoney(amount)
                    )
            );
        }

        return result;
    }

    private BigDecimal calculateDailyAverage(
            BigDecimal totalSpent,
            LocalDate month
    ) {
        LocalDate today = LocalDate.now(ZONE_ID);
        LocalDate currentMonth = today.withDayOfMonth(1);

        int days;

        if (month.equals(currentMonth)) {
            days = today.getDayOfMonth();
        } else {
            days = month.lengthOfMonth();
        }

        return totalSpent.divide(
                BigDecimal.valueOf(days),
                2,
                RoundingMode.HALF_UP
        );
    }

    private LocalDate normalizeMonth(LocalDate date) {
        LocalDate value = date == null
                ? LocalDate.now(ZONE_ID)
                : date;

        return value.withDayOfMonth(1);
    }

    private MonthWindow monthWindow(LocalDate month) {
        Instant start = month
                .atStartOfDay(ZONE_ID)
                .toInstant();

        Instant end = month
                .plusMonths(1)
                .atStartOfDay(ZONE_ID)
                .toInstant();

        return new MonthWindow(start, end);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return zeroIfNull(value).setScale(
                2,
                RoundingMode.HALF_UP
        );
    }

    private record MonthWindow(
            Instant start,
            Instant end
    ) {
    }
}