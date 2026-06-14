package cs.sbs.web.personalprojectweb2026.dto.auth;

import cs.sbs.web.personalprojectweb2026.entity.AppUser;

public record CurrentUserResponse(
        Long id,
        String email,
        String displayName,
        String role
) {

    public static CurrentUserResponse from(AppUser user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name()
        );
    }
}