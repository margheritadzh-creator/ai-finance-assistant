package cs.sbs.web.personalprojectweb2026.dto.preference;

import cs.sbs.web.personalprojectweb2026.entity.UserPreference;

import java.math.BigDecimal;

public record UserPreferenceResponse(
        Long id,
        Long userId,
        String regionCode,
        String regionName,
        BigDecimal priceIndex,
        String spendingLevel,
        BigDecimal monthlyIncome,
        BigDecimal defaultMonthlyBudget,
        boolean warningEnabled,
        String warningLevel,
        String preferredLanguage,
        String speechLanguage,
        String currency
) {

    public static UserPreferenceResponse from(
            UserPreference preference
    ) {
        return new UserPreferenceResponse(
                preference.getId(),
                preference.getUser().getId(),
                preference.getRegionCode(),
                preference.getRegionName(),
                preference.getPriceIndex(),
                preference.getSpendingLevel().name(),
                preference.getMonthlyIncome(),
                preference.getDefaultMonthlyBudget(),
                preference.isWarningEnabled(),
                preference.getWarningLevel().name(),
                preference.getPreferredLanguage(),
                preference.getSpeechLanguage(),
                preference.getCurrency()
        );
    }
}