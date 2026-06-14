package cs.sbs.web.personalprojectweb2026.dto.auth;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        CurrentUserResponse user
) {
}