package cs.sbs.web.personalprojectweb2026.service.analytics;

import cs.sbs.web.personalprojectweb2026.dto.analytics.ExpensePredictionResponse;
import cs.sbs.web.personalprojectweb2026.entity.AppUser;
import cs.sbs.web.personalprojectweb2026.entity.MonthlyPrediction;
import cs.sbs.web.personalprojectweb2026.entity.enums.PredictionAlgorithm;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.AppUserRepository;
import cs.sbs.web.personalprojectweb2026.repository.ExpenseRecordRepository;
import cs.sbs.web.personalprojectweb2026.repository.MonthlyPredictionRepository;
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
public class PredictionService {

    private static final ZoneId ZONE_ID =
            ZoneId.of("Asia/Shanghai");

    private static final String MODEL_VERSION =
            "expense-prediction-v1";

    private static final int MAX_HISTORY_MONTHS = 6;

    private final AppUserRepository appUserRepository;
    private final ExpenseRecordRepository expenseRecordRepository;
    private final MonthlyPredictionRepository predictionRepository;

    public PredictionService(
            AppUserRepository appUserRepository,
            ExpenseRecordRepository expenseRecordRepository,
            MonthlyPredictionRepository predictionRepository
    ) {
        this.appUserRepository = appUserRepository;
        this.expenseRecordRepository = expenseRecordRepository;
        this.predictionRepository = predictionRepository;
    }

    @Transactional
    public ExpensePredictionResponse generatePrediction(
            Long userId,
            LocalDate requestedMonth
    ) {
        AppUser user = requireUser(userId);
        LocalDate targetMonth = normalizeTargetMonth(
                requestedMonth
        );

        List<MonthlyAmount> history = loadHistory(
                userId,
                targetMonth
        );

        PredictionResult result = calculatePrediction(history);

        MonthlyPrediction prediction = predictionRepository
                .findByUser_IdAndTargetMonthAndModelVersion(
                        userId,
                        targetMonth,
                        MODEL_VERSION
                )
                .orElseGet(MonthlyPrediction::new);

        prediction.setUser(user);
        prediction.setTargetMonth(targetMonth);
        prediction.setPredictedAmount(
                money(result.predictedAmount())
        );
        prediction.setLowerBound(
                money(result.lowerBound())
        );
        prediction.setUpperBound(
                money(result.upperBound())
        );
        prediction.setAlgorithm(result.algorithm());
        prediction.setModelVersion(MODEL_VERSION);
        prediction.setBasedOnMonths(history.size());
        prediction.setExplanation(
                createExplanation(
                        result,
                        history.size()
                )
        );
        prediction.setGeneratedAt(Instant.now());

        return ExpensePredictionResponse.from(
                predictionRepository.save(prediction)
        );
    }

    @Transactional(readOnly = true)
    public ExpensePredictionResponse getPrediction(
            Long userId,
            LocalDate requestedMonth
    ) {
        LocalDate targetMonth = normalizeTargetMonth(
                requestedMonth
        );

        MonthlyPrediction prediction = predictionRepository
                .findFirstByUser_IdAndTargetMonthOrderByGeneratedAtDesc(
                        userId,
                        targetMonth
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "该月份还没有生成支出预测"
                        )
                );

        return ExpensePredictionResponse.from(prediction);
    }

    private List<MonthlyAmount> loadHistory(
            Long userId,
            LocalDate targetMonth
    ) {
        List<MonthlyAmount> result = new ArrayList<>();

        LocalDate firstMonth = targetMonth.minusMonths(
                MAX_HISTORY_MONTHS
        );

        for (int index = 0;
             index < MAX_HISTORY_MONTHS;
             index++) {

            LocalDate month = firstMonth.plusMonths(index);
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

            BigDecimal amount = expenseRecordRepository
                    .sumAmountForPeriod(
                            userId,
                            window.start(),
                            window.end()
                    );

            result.add(
                    new MonthlyAmount(
                            month,
                            zeroIfNull(amount)
                    )
            );
        }

        return result;
    }

    private PredictionResult calculatePrediction(
            List<MonthlyAmount> history
    ) {
        if (history.isEmpty()) {
            return new PredictionResult(
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    PredictionAlgorithm
                            .INSUFFICIENT_DATA_ESTIMATE
            );
        }

        BigDecimal predictedAmount;
        PredictionAlgorithm algorithm;

        if (history.size() < 3) {
            predictedAmount = average(history);
            algorithm = PredictionAlgorithm
                    .INSUFFICIENT_DATA_ESTIMATE;
        } else {
            predictedAmount = weightedRecentAverage(history);
            algorithm = PredictionAlgorithm
                    .WEIGHTED_MOVING_AVERAGE;

            if (history.size() >= 4) {
                BigDecimal trend = calculateMonthlyTrend(history);

                predictedAmount = predictedAmount
                        .add(trend)
                        .max(BigDecimal.ZERO);

                algorithm = PredictionAlgorithm
                        .TREND_ADJUSTED_AVERAGE;
            }
        }

        BigDecimal deviation = calculateStandardDeviation(
                history
        );

        BigDecimal percentageMargin =
                predictedAmount.multiply(
                        history.size() < 3
                                ? new BigDecimal("0.20")
                                : new BigDecimal("0.10")
                );

        BigDecimal margin = deviation.max(
                percentageMargin
        );

        BigDecimal lowerBound = predictedAmount
                .subtract(margin)
                .max(BigDecimal.ZERO);

        BigDecimal upperBound = predictedAmount.add(margin);

        return new PredictionResult(
                predictedAmount,
                lowerBound,
                upperBound,
                algorithm
        );
    }

    private BigDecimal weightedRecentAverage(
            List<MonthlyAmount> history
    ) {
        int size = history.size();

        List<MonthlyAmount> recent = history.subList(
                Math.max(0, size - 3),
                size
        );

        if (recent.size() == 1) {
            return recent.getFirst().amount();
        }

        if (recent.size() == 2) {
            return recent.get(0).amount()
                    .multiply(new BigDecimal("0.35"))
                    .add(
                            recent.get(1).amount()
                                    .multiply(
                                            new BigDecimal("0.65")
                                    )
                    );
        }

        return recent.get(0).amount()
                .multiply(new BigDecimal("0.20"))
                .add(
                        recent.get(1).amount()
                                .multiply(
                                        new BigDecimal("0.30")
                                )
                )
                .add(
                        recent.get(2).amount()
                                .multiply(
                                        new BigDecimal("0.50")
                                )
                );
    }

    private BigDecimal average(
            List<MonthlyAmount> history
    ) {
        BigDecimal total = history.stream()
                .map(MonthlyAmount::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return total.divide(
                BigDecimal.valueOf(history.size()),
                4,
                RoundingMode.HALF_UP
        );
    }

    private BigDecimal calculateMonthlyTrend(
            List<MonthlyAmount> history
    ) {
        int count = history.size();

        double averageX = (count - 1) / 2.0;
        double averageY = history.stream()
                .mapToDouble(value ->
                        value.amount().doubleValue()
                )
                .average()
                .orElse(0);

        double numerator = 0;
        double denominator = 0;

        for (int index = 0; index < count; index++) {
            double xDifference = index - averageX;
            double yDifference =
                    history.get(index).amount().doubleValue()
                            - averageY;

            numerator += xDifference * yDifference;
            denominator += xDifference * xDifference;
        }

        if (denominator == 0) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(
                numerator / denominator
        );
    }

    private BigDecimal calculateStandardDeviation(
            List<MonthlyAmount> history
    ) {
        if (history.size() < 2) {
            return BigDecimal.ZERO;
        }

        double average = history.stream()
                .mapToDouble(value ->
                        value.amount().doubleValue()
                )
                .average()
                .orElse(0);

        double variance = history.stream()
                .mapToDouble(value -> {
                    double difference =
                            value.amount().doubleValue()
                                    - average;

                    return difference * difference;
                })
                .average()
                .orElse(0);

        return BigDecimal.valueOf(Math.sqrt(variance));
    }

    private String createExplanation(
            PredictionResult result,
            int historySize
    ) {
        if (historySize == 0) {
            return "暂无历史账单，当前无法形成可靠预测。"
                    + "预测值暂记为0元。";
        }

        if (historySize < 3) {
            return "当前预测基于"
                    + historySize
                    + "个月的历史支出，数据量较少，"
                    + "结果仅供参考。";
        }

        if (result.algorithm()
                == PredictionAlgorithm
                .TREND_ADJUSTED_AVERAGE) {
            return "预测基于最近"
                    + historySize
                    + "个月的支出，并结合近期变化趋势计算。"
                    + "实际支出可能受临时大额消费影响。";
        }

        return "预测采用近期月份权重更高的加权平均方法，"
                + "基于最近"
                + historySize
                + "个月的支出计算。";
    }

    private LocalDate normalizeTargetMonth(
            LocalDate requestedMonth
    ) {
        if (requestedMonth == null) {
            return LocalDate.now(ZONE_ID)
                    .withDayOfMonth(1)
                    .plusMonths(1);
        }

        return requestedMonth.withDayOfMonth(1);
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

    private record MonthlyAmount(
            LocalDate month,
            BigDecimal amount
    ) {
    }

    private record MonthWindow(
            Instant start,
            Instant end
    ) {
    }

    private record PredictionResult(
            BigDecimal predictedAmount,
            BigDecimal lowerBound,
            BigDecimal upperBound,
            PredictionAlgorithm algorithm
    ) {
    }
}