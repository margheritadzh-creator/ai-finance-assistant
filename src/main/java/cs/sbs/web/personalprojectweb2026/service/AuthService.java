package cs.sbs.web.personalprojectweb2026.service;

import cs.sbs.web.personalprojectweb2026.dto.auth.AuthResponse;
import cs.sbs.web.personalprojectweb2026.dto.auth.CurrentUserResponse;
import cs.sbs.web.personalprojectweb2026.dto.auth.LoginRequest;
import cs.sbs.web.personalprojectweb2026.dto.auth.RegisterRequest;
import cs.sbs.web.personalprojectweb2026.entity.AppUser;
import cs.sbs.web.personalprojectweb2026.entity.UserPreference;
import cs.sbs.web.personalprojectweb2026.entity.enums.UserRole;
import cs.sbs.web.personalprojectweb2026.exception.DuplicateResourceException;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.AppUserRepository;
import cs.sbs.web.personalprojectweb2026.repository.UserPreferenceRepository;
import cs.sbs.web.personalprojectweb2026.security.AppUserPrincipal;
import cs.sbs.web.personalprojectweb2026.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository appUserRepository,
            UserPreferenceRepository userPreferenceRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.appUserRepository = appUserRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (appUserRepository
                .existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException(
                    "该邮箱已经注册"
            );
        }

        AppUser user = new AppUser();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );
        user.setDisplayName(request.displayName().trim());
        user.setRole(UserRole.USER);
        user.setEnabled(true);

        AppUser savedUser = appUserRepository.save(user);

        UserPreference preference = new UserPreference();
        preference.setUser(savedUser);
        userPreferenceRepository.save(preference);

        return createAuthResponse(
                AppUserPrincipal.from(savedUser)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                normalizedEmail,
                                request.password()
                        )
                );

        AppUserPrincipal principal =
                (AppUserPrincipal) authentication.getPrincipal();

        return createAuthResponse(principal);
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(Long userId) {
        AppUser user = appUserRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "当前用户不存在"
                        )
                );

        return CurrentUserResponse.from(user);
    }

    private AuthResponse createAuthResponse(
            AppUserPrincipal principal
    ) {
        AppUser user = appUserRepository
                .findById(principal.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "用户不存在"
                        )
                );

        return new AuthResponse(
                jwtService.generateToken(principal),
                "Bearer",
                jwtService.getExpirationSeconds(),
                CurrentUserResponse.from(user)
        );
    }

    private String normalizeEmail(String email) {
        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}