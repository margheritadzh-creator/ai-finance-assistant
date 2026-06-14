package cs.sbs.web.personalprojectweb2026.service.validation;

import cs.sbs.web.personalprojectweb2026.dto.expense.ExpenseAnomalyResponse;
import cs.sbs.web.personalprojectweb2026.entity.ExpenseRecord;
import cs.sbs.web.personalprojectweb2026.entity.PriceReferenceRule;
import cs.sbs.web.personalprojectweb2026.entity.UserPreference;
import cs.sbs.web.personalprojectweb2026.entity.enums.ExpenseAnomalyLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.SpendingLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.WarningLevel;
import cs.sbs.web.personalprojectweb2026.repository.ExpenseRecordRepository;
import cs.sbs.web.personalprojectweb2026.repository.PriceReferenceRuleRepository;
import cs.sbs.web.personalprojectweb2026.repository.UserPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ExpenseAnomalyService {

    private final UserPreferenceRepository userPreferenceRepository;
    private final PriceReferenceRuleRepository priceRuleRepository;
    private final ExpenseRecordRepository expenseRecordRepository;

    public ExpenseAnomalyService(
            UserPreferenceRepository userPreferenceRepository,
            PriceReferenceRuleRepository priceRuleRepository,
            ExpenseRecordRepository expenseRecordRepository
    ) {
        this.userPreferenceRepository = userPreferenceRepository;
        this.priceRuleRepository = priceRuleRepository;
        this.expenseRecordRepository = expenseRecordRepository;
    }

    @Transactional(readOnly = true)
    public ExpenseAnomalyResponse evaluate(
            Long userId,
            String itemName,
            BigDecimal amount,
            BigDecimal quantity
    ) {
        PreferenceValues preference = getPreferenceValues(userId);

        BigDecimal unitAmount = calculateUnitAmount(
                amount,
                quantity
        );

        List<PriceReferenceRule> rules =
                priceRuleRepository.findMatchingRules(
                        itemName.trim(),
                        preference.regionCode(),
                        preference.spendingLevel().name()
                );

        PriceReferenceRule rule = rules.isEmpty()
                ? null
                : rules.getFirst();

        BigDecimal ruleMinimum = null;
        BigDecimal ruleMaximum = null;

        if (rule != null) {
            BigDecimal adjustment = preference.priceIndex()
                    .multiply(
                            spendingMultiplier(
                                    preference.spendingLevel()
                            )
                    );

            if (rule.getMinReasonable() != null) {
                ruleMinimum = rule.getMinReasonable()
                        .multiply(adjustment);
            }

            ruleMaximum = rule.getMaxReasonable()
                    .multiply(adjustment);
        }

        BigDecimal historicalMedian = calculateHistoricalMedian(
                userId,
                itemName
        );

        BigDecimal historicalMaximum = null;

        if (historicalMedian != null) {
            historicalMaximum = historicalMedian.multiply(
                    historyMultiplier(preference.warningLevel())
            );
        }

        BigDecimal effectiveMaximum = largerValue(
                ruleMaximum,
                historicalMaximum
        );

        BigDecimal effectiveMinimum = ruleMinimum;

        if (effectiveMaximum == null
                && effectiveMinimum == null) {
            return noAnomaly();
        }

        if (effectiveMaximum != null
                && unitAmount.compareTo(effectiveMaximum) > 0) {
            BigDecimal ratio = unitAmount.divide(
                    effectiveMaximum,
                    4,
                    RoundingMode.HALF_UP
            );

            String message =
                    "该金额明显高于常见价格或您的历史消费记录，"
                            + "请检查是否存在小数点、数量或单位输入错误。";

            return new ExpenseAnomalyResponse(
                    ExpenseAnomalyLevel.WARNING.name(),
                    calculateScore(ratio),
                    message,
                    round(effectiveMinimum),
                    round(effectiveMaximum),
                    round(historicalMedian)
            );
        }

        if (effectiveMinimum != null
                && unitAmount.compareTo(
                effectiveMinimum.multiply(
                        new BigDecimal("0.20")
                )
        ) < 0) {
            return new ExpenseAnomalyResponse(
                    ExpenseAnomalyLevel.NOTICE.name(),
                    new BigDecimal("0.5000"),
                    "该金额明显低于常见价格，请确认金额和单位是否正确。",
                    round(effectiveMinimum),
                    round(effectiveMaximum),
                    round(historicalMedian)
            );
        }

        if (effectiveMaximum != null
                && unitAmount.compareTo(
                effectiveMaximum.multiply(
                        new BigDecimal("0.75")
                )
        ) > 0) {
            return new ExpenseAnomalyResponse(
                    ExpenseAnomalyLevel.NOTICE.name(),
                    new BigDecimal("0.6500"),
                    "该金额相对较高，建议再次确认后保存。",
                    round(effectiveMinimum),
                    round(effectiveMaximum),
                    round(historicalMedian)
            );
        }

        return new ExpenseAnomalyResponse(
                ExpenseAnomalyLevel.NONE.name(),
                BigDecimal.ZERO.setScale(4),
                null,
                round(effectiveMinimum),
                round(effectiveMaximum),
                round(historicalMedian)
        );
    }

    private PreferenceValues getPreferenceValues(Long userId) {
        return userPreferenceRepository
                .findByUser_Id(userId)
                .map(this::toPreferenceValues)
                .orElseGet(() ->
                        new PreferenceValues(
                                "CN",
                                BigDecimal.ONE,
                                SpendingLevel.STANDARD,
                                WarningLevel.MEDIUM
                        )
                );
    }

    private PreferenceValues toPreferenceValues(
            UserPreference preference
    ) {
        return new PreferenceValues(
                preference.getRegionCode(),
                preference.getPriceIndex(),
                preference.getSpendingLevel(),
                preference.getWarningLevel()
        );
    }

    private BigDecimal calculateHistoricalMedian(
            Long userId,
            String itemName
    ) {
        List<BigDecimal> values = new ArrayList<>();

        for (ExpenseRecord expense :
                expenseRecordRepository
                        .findTop20ByUser_IdAndItemNameIgnoreCaseOrderByOccurredAtDesc(
                                userId,
                                itemName.trim()
                        )) {

            boolean usableRecord =
                    expense.getAnomalyLevel()
                            == ExpenseAnomalyLevel.NONE
                            || expense.isAnomalyConfirmed();

            if (!usableRecord) {
                continue;
            }

            values.add(
                    calculateUnitAmount(
                            expense.getAmount(),
                            expense.getQuantity()
                    )
            );
        }

        if (values.size() < 5) {
            return null;
        }

        values.sort(Comparator.naturalOrder());

        int middle = values.size() / 2;

        if (values.size() % 2 == 1) {
            return values.get(middle);
        }

        return values.get(middle - 1)
                .add(values.get(middle))
                .divide(
                        new BigDecimal("2"),
                        4,
                        RoundingMode.HALF_UP
                );
    }

    private BigDecimal calculateUnitAmount(
            BigDecimal amount,
            BigDecimal quantity
    ) {
        if (quantity == null
                || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return amount;
        }

        return amount.divide(
                quantity,
                4,
                RoundingMode.HALF_UP
        );
    }

    private BigDecimal spendingMultiplier(
            SpendingLevel level
    ) {
        return switch (level) {
            case ECONOMICAL -> new BigDecimal("0.85");
            case STANDARD -> BigDecimal.ONE;
            case COMFORTABLE -> new BigDecimal("1.50");
            case PREMIUM -> new BigDecimal("3.00");
            case CUSTOM -> BigDecimal.ONE;
        };
    }

    private BigDecimal historyMultiplier(
            WarningLevel level
    ) {
        return switch (level) {
            case HIGH -> new BigDecimal("2.50");
            case MEDIUM -> new BigDecimal("4.00");
            case LOW -> new BigDecimal("6.00");
        };
    }

    private BigDecimal largerValue(
            BigDecimal first,
            BigDecimal second
    ) {
        if (first == null) {
            return second;
        }

        if (second == null) {
            return first;
        }

        return first.max(second);
    }

    private BigDecimal calculateScore(BigDecimal ratio) {
        return ratio.divide(
                        new BigDecimal("2"),
                        4,
                        RoundingMode.HALF_UP
                )
                .min(BigDecimal.ONE)
                .setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal round(BigDecimal value) {
        return value == null
                ? null
                : value.setScale(2, RoundingMode.HALF_UP);
    }

    private ExpenseAnomalyResponse noAnomaly() {
        return new ExpenseAnomalyResponse(
                ExpenseAnomalyLevel.NONE.name(),
                BigDecimal.ZERO.setScale(4),
                null,
                null,
                null,
                null
        );
    }

    private record PreferenceValues(
            String regionCode,
            BigDecimal priceIndex,
            SpendingLevel spendingLevel,
            WarningLevel warningLevel
    ) {
    }
}