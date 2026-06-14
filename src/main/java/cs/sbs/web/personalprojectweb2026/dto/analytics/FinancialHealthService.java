package cs.sbs.web.personalprojectweb2026.service.analytics;

import cs.sbs.web.personalprojectweb2026.dto.analytics.FinancialHealthResponse;
import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetOverviewResponse;
import cs.sbs.web.personalprojectweb2026.entity.AppUser;
import cs.sbs.web.personalprojectweb2026.entity.FinancialHealthScore;
import cs.sbs.web.personalprojectweb2026.entity.UserPreference;
import cs.sbs.web.personalprojectweb2026.entity.enums.ExpenseAnomalyLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.FinancialHealthLevel;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.AppUserRepository;
import cs.sbs.web.personalprojectweb2026.repository.ExpenseRecordRepository;
import cs.sbs.web.personalprojectweb2026.repository.FinancialHealthScoreRepository;
import cs.sbs.web.personalprojectweb2026.repository.UserPreferenceRepository;
import cs.sbs.web.personalprojectweb2026.service.BudgetService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FinancialHealthService {

    private static final ZoneId ZONE_ID =
            ZoneId.of("Asia/Shanghai");

    private final AppUserRepository appUserRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final ExpenseRecordRepository expenseRecordRepository;
    private final FinancialHealthScoreRepository healthScoreRepository;
    private final BudgetService budgetService;

    public FinancialHealthService(
            AppUserRepository appUserRepository,
            UserPreferenceRepository preferenceRepository,
            ExpenseRecordRepository expenseRecordRepository,
            FinancialHealthScoreRepository healthScoreRepository,
            BudgetService budgetService
    ) {
        this.appUserRepository = appUserRepository;
        this.preferenceRepository = preferenceRepository;
        this.expenseRecordRepository = expenseRecordRepository;
        this.healthScoreRepository = healthScoreRepository;
        this.budgetService = budgetService;
    }

    @Transactional
    public FinancialHealthResponse calculateHealthScore(
            Long userId,
            LocalDate requestedMonth
    ) {
        AppUser user = requireUser(userId);
        LocalDate month = normalizeMonth(requestedMonth);
        MonthWindow window = monthWindow(month);

        BigDecimal totalSpent = zeroIfNull(
                expenseRecordRepository.sumAmountForPeriod(
                        userId,
                        window.start(),
                        window.end()
                )
        );

        long expenseCount = expenseRecordRepository
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

        BudgetOverviewResponse budget =
                budgetService.getOverview(userId, month);

        List<Object[]> categoryRows =
                expenseRecordRepository
                        .summarizeByCategoryForPeriod(
                                userId,
                                window.start(),
                                window.end()
                        );

        UserPreference preference = preferenceRepository
                .findByUser_Id(userId)
                .orElse(null);

        BigDecimal budgetScore = calculateBudgetScore(
                totalSpent,
                budget.totalBudget()
        );

        BigDecimal stabilityScore =
                calculateStabilityScore(userId, month);

        BigDecimal savingScore = calculateSavingScore(
                totalSpent,
                budget.totalBudget(),
                preference
        );

        BigDecimal structureScore =
                calculateStructureScore(
                        totalSpent,
                        categoryRows
                );

        BigDecimal riskScore = calculateRiskScore(
                expenseCount,
                anomalyCount
        );

        BigDecimal totalScore = budgetScore
                .add(stabilityScore)
                .add(savingScore)
                .add(structureScore)
                .add(riskScore)
                .setScale(2, RoundingMode.HALF_UP);

        FinancialHealthLevel level =
                determineLevel(totalScore);

        Map<String, Object> detail = createDetail(
                totalSpent,
                budget,
                expenseCount,
                anomalyCount,
                categoryRows,
                preference
        );

        FinancialHealthScore score = healthScoreRepository
                .findByUser_IdAndScoreMonth(
                        userId,
                        month
                )
                .orElseGet(FinancialHealthScore::new);

        score.setUser(user);
        score.setScoreMonth(month);
        score.setTotalScore(totalScore);
        score.setBudgetScore(budgetScore);
        score.setStabilityScore(stabilityScore);
        score.setSavingScore(savingScore);
        score.setStructureScore(structureScore);
        score.setRiskScore(riskScore);
        score.setLevel(level);
        score.setDetail(detail);

        return FinancialHealthResponse.from(
                healthScoreRepository.save(score)
        );
    }

    @Transactional(readOnly = true)
    public FinancialHealthResponse getHealthScore(
            Long userId,
            LocalDate requestedMonth
    ) {
        LocalDate month = normalizeMonth(requestedMonth);

        FinancialHealthScore score = healthScoreRepository
                .findByUser_IdAndScoreMonth(
                        userId,
                        month
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "该月份还没有生成财务健康评分"
                        )
                );

        return FinancialHealthResponse.from(score);
    }

    private BigDecimal calculateBudgetScore(
            BigDecimal spent,
            BigDecimal budget
    ) {
        if (budget == null
                || budget.compareTo(BigDecimal.ZERO) <= 0) {
            return new BigDecimal("15.00");
        }

        BigDecimal ratio = spent.divide(
                budget,
                6,
                RoundingMode.HALF_UP
        );

        double value;

        if (ratio.compareTo(new BigDecimal("0.80")) <= 0) {
            value = 30;
        } else if (ratio.compareTo(BigDecimal.ONE) <= 0) {
            double progress = ratio
                    .subtract(new BigDecimal("0.80"))
                    .divide(
                            new BigDecimal("0.20"),
                            6,
                            RoundingMode.HALF_UP
                    )
                    .doubleValue();

            value = 30 - progress * 10;
        } else {
            double overRatio = ratio
                    .subtract(BigDecimal.ONE)
                    .doubleValue();

            value = 20 - overRatio * 40;
        }

        return score(value, 30);
    }

    private BigDecimal calculateStabilityScore(
            Long userId,
            LocalDate currentMonth
    ) {
        List<BigDecimal> monthlyAmounts =
                new ArrayList<>();

        for (int offset = 4; offset >= 1; offset--) {
            LocalDate month =
                    currentMonth.minusMonths(offset);

            MonthWindow window = monthWindow(month);

            long count = expenseRecordRepository
                    .countByUser_IdAndOccurredAtGreaterThanEqualAndOccurredAtLessThan(
                            userId,
                            window.start(),
                            window.end()
                    );

            if (count == 0) {
                continue;
            }

            monthlyAmounts.add(
                    zeroIfNull(
                            expenseRecordRepository
                                    .sumAmountForPeriod(
                                            userId,
                                            window.start(),
                                            window.end()
                                    )
                    )
            );
        }

        if (monthlyAmounts.size() < 2) {
            return new BigDecimal("10.00");
        }

        double average = monthlyAmounts.stream()
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0);

        if (average <= 0) {
            return new BigDecimal("20.00");
        }

        double variance = monthlyAmounts.stream()
                .mapToDouble(value -> {
                    double difference =
                            value.doubleValue() - average;

                    return difference * difference;
                })
                .average()
                .orElse(0);

        double deviation = Math.sqrt(variance);
        double coefficient = deviation / average;

        double value = 20 * (
                1 - Math.min(coefficient, 1)
        );

        return score(value, 20);
    }

    private BigDecimal calculateSavingScore(
            BigDecimal spent,
            BigDecimal budget,
            UserPreference preference
    ) {
        BigDecimal income = preference == null
                ? null
                : preference.getMonthlyIncome();

        if (income != null
                && income.compareTo(BigDecimal.ZERO) > 0) {

            BigDecimal savingRate = income
                    .subtract(spent)
                    .divide(
                            income,
                            6,
                            RoundingMode.HALF_UP
                    );

            double value;

            if (savingRate.compareTo(
                    new BigDecimal("0.20")
            ) >= 0) {
                value = 20;
            } else if (savingRate.compareTo(
                    BigDecimal.ZERO
            ) >= 0) {
                value = 10
                        + savingRate.doubleValue() / 0.20 * 10;
            } else {
                value = 10
                        + savingRate.doubleValue() * 20;
            }

            return score(value, 20);
        }

        if (budget != null
                && budget.compareTo(BigDecimal.ZERO) > 0) {

            BigDecimal remainingRate = budget
                    .subtract(spent)
                    .divide(
                            budget,
                            6,
                            RoundingMode.HALF_UP
                    );

            double value;

            if (remainingRate.compareTo(
                    new BigDecimal("0.20")
            ) >= 0) {
                value = 15;
            } else if (remainingRate.compareTo(
                    BigDecimal.ZERO
            ) >= 0) {
                value = 8
                        + remainingRate.doubleValue()
                        / 0.20 * 7;
            } else {
                value = 8
                        + remainingRate.doubleValue() * 10;
            }

            return score(value, 20);
        }

        return new BigDecimal("8.00");
    }

    private BigDecimal calculateStructureScore(
            BigDecimal totalSpent,
            List<Object[]> categoryRows
    ) {
        if (totalSpent.compareTo(BigDecimal.ZERO) <= 0) {
            return new BigDecimal("10.00");
        }

        BigDecimal highestAmount = BigDecimal.ZERO;
        BigDecimal otherAmount = BigDecimal.ZERO;

        for (Object[] row : categoryRows) {
            String categoryCode = (String) row[1];
            BigDecimal amount = zeroIfNull(
                    (BigDecimal) row[3]
            );

            highestAmount = highestAmount.max(amount);

            if ("OTHER".equals(categoryCode)) {
                otherAmount = amount;
            }
        }

        double highestShare = highestAmount
                .divide(
                        totalSpent,
                        6,
                        RoundingMode.HALF_UP
                )
                .doubleValue();

        double otherShare = otherAmount
                .divide(
                        totalSpent,
                        6,
                        RoundingMode.HALF_UP
                )
                .doubleValue();

        double value = 15;

        if (highestShare > 0.60) {
            value -= Math.min(
                    6,
                    (highestShare - 0.60) / 0.40 * 6
            );
        }

        if (otherShare > 0.20) {
            value -= Math.min(
                    4,
                    (otherShare - 0.20) / 0.80 * 4
            );
        }

        return score(value, 15);
    }

    private BigDecimal calculateRiskScore(
            long expenseCount,
            long anomalyCount
    ) {
        if (expenseCount == 0) {
            return new BigDecimal("15.00");
        }

        double anomalyRate =
                (double) anomalyCount / expenseCount;

        double value = 15 * (
                1 - Math.min(anomalyRate * 2, 1)
        );

        return score(value, 15);
    }

    private FinancialHealthLevel determineLevel(
            BigDecimal totalScore
    ) {
        if (totalScore.compareTo(
                new BigDecimal("85")
        ) >= 0) {
            return FinancialHealthLevel.EXCELLENT;
        }

        if (totalScore.compareTo(
                new BigDecimal("70")
        ) >= 0) {
            return FinancialHealthLevel.GOOD;
        }

        if (totalScore.compareTo(
                new BigDecimal("55")
        ) >= 0) {
            return FinancialHealthLevel.FAIR;
        }

        return FinancialHealthLevel.RISK;
    }

    private Map<String, Object> createDetail(
            BigDecimal totalSpent,
            BudgetOverviewResponse budget,
            long expenseCount,
            long anomalyCount,
            List<Object[]> categoryRows,
            UserPreference preference
    ) {
        Map<String, Object> detail =
                new LinkedHashMap<>();

        detail.put("本月支出", money(totalSpent));
        detail.put("本月预算", budget.totalBudget());
        detail.put("预算使用比例", budget.usageRatio());
        detail.put("账单数量", expenseCount);
        detail.put("异常账单数量", anomalyCount);
        detail.put("消费分类数量", categoryRows.size());
        detail.put(
                "是否提供月收入",
                preference != null
                        && preference.getMonthlyIncome() != null
        );

        return detail;
    }

    private BigDecimal score(
            double value,
            double maximum
    ) {
        double safeValue = Math.max(
                0,
                Math.min(value, maximum)
        );

        return BigDecimal.valueOf(safeValue)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private LocalDate normalizeMonth(
            LocalDate requestedMonth
    ) {
        LocalDate month = requestedMonth == null
                ? LocalDate.now(ZONE_ID)
                : requestedMonth;

        return month.withDayOfMonth(1);
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

    private AppUser requireUser(Long userId) {
        return appUserRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "当前用户不存在"
                        )
                );
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null
                ? BigDecimal.ZERO
                : value;
    }

    private BigDecimal money(BigDecimal value) {
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