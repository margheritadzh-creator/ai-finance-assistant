package cs.sbs.web.personalprojectweb2026.service;

import cs.sbs.web.personalprojectweb2026.dto.preference.UserPreferenceResponse;
import cs.sbs.web.personalprojectweb2026.dto.preference.UserPreferenceUpdateRequest;
import cs.sbs.web.personalprojectweb2026.entity.AppUser;
import cs.sbs.web.personalprojectweb2026.entity.UserPreference;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.AppUserRepository;
import cs.sbs.web.personalprojectweb2026.repository.UserPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UserPreferenceService {

    private final UserPreferenceRepository userPreferenceRepository;
    private final AppUserRepository appUserRepository;

    public UserPreferenceService(
            UserPreferenceRepository userPreferenceRepository,
            AppUserRepository appUserRepository
    ) {
        this.userPreferenceRepository = userPreferenceRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional(readOnly = true)
    public UserPreferenceResponse getPreference(Long userId) {
        UserPreference preference = userPreferenceRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "尚未设置用户消费偏好"
                        )
                );

        return UserPreferenceResponse.from(preference);
    }

    @Transactional
    public UserPreferenceResponse updatePreference(
            Long userId,
            UserPreferenceUpdateRequest request
    ) {
        UserPreference preference = userPreferenceRepository
                .findByUser_Id(userId)
                .orElseGet(() -> createPreference(userId));

        preference.setRegionCode(
                request.regionCode()
                        .trim()
                        .toUpperCase(Locale.ROOT)
        );
        preference.setRegionName(request.regionName().trim());
        preference.setPriceIndex(request.priceIndex());
        preference.setSpendingLevel(request.spendingLevel());
        preference.setMonthlyIncome(request.monthlyIncome());
        preference.setDefaultMonthlyBudget(
                request.defaultMonthlyBudget()
        );
        preference.setWarningEnabled(request.warningEnabled());
        preference.setWarningLevel(request.warningLevel());
        preference.setPreferredLanguage(
                request.preferredLanguage()
        );
        preference.setSpeechLanguage(request.speechLanguage());
        preference.setCurrency(
                request.currency()
                        .trim()
                        .toUpperCase(Locale.ROOT)
        );

        return UserPreferenceResponse.from(
                userPreferenceRepository.save(preference)
        );
    }

    private UserPreference createPreference(Long userId) {
        AppUser user = appUserRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "当前用户不存在"
                        )
                );

        UserPreference preference = new UserPreference();
        preference.setUser(user);
        return preference;
    }
}