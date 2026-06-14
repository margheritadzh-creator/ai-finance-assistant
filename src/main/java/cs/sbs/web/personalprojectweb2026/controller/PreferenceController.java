package cs.sbs.web.personalprojectweb2026.controller;

import cs.sbs.web.personalprojectweb2026.dto.preference.UserPreferenceResponse;
import cs.sbs.web.personalprojectweb2026.dto.preference.UserPreferenceUpdateRequest;
import cs.sbs.web.personalprojectweb2026.service.UserPreferenceService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
public class PreferenceController {

    private final UserPreferenceService userPreferenceService;

    public PreferenceController(
            UserPreferenceService userPreferenceService
    ) {
        this.userPreferenceService = userPreferenceService;
    }

    @GetMapping
    public UserPreferenceResponse getPreference(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return userPreferenceService.getPreference(
                Long.valueOf(jwt.getSubject())
        );
    }

    @PutMapping
    public UserPreferenceResponse updatePreference(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            UserPreferenceUpdateRequest request
    ) {
        return userPreferenceService.updatePreference(
                Long.valueOf(jwt.getSubject()),
                request
        );
    }
}