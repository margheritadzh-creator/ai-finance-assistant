package cs.sbs.web.personalprojectweb2026.controller;

import cs.sbs.web.personalprojectweb2026.dto.auth.AuthResponse;
import cs.sbs.web.personalprojectweb2026.dto.auth.CurrentUserResponse;
import cs.sbs.web.personalprojectweb2026.dto.auth.LoginRequest;
import cs.sbs.web.personalprojectweb2026.dto.auth.RegisterRequest;
import cs.sbs.web.personalprojectweb2026.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public CurrentUserResponse currentUser(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());
        return authService.getCurrentUser(userId);
    }
}