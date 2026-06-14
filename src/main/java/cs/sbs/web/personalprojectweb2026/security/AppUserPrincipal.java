package cs.sbs.web.personalprojectweb2026.security;

import cs.sbs.web.personalprojectweb2026.entity.AppUser;
import cs.sbs.web.personalprojectweb2026.entity.enums.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class AppUserPrincipal implements UserDetails {

    private final Long userId;
    private final String email;
    private final String passwordHash;
    private final String displayName;
    private final UserRole role;
    private final boolean enabled;

    private AppUserPrincipal(
            Long userId,
            String email,
            String passwordHash,
            String displayName,
            UserRole role,
            boolean enabled
    ) {
        this.userId = userId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.role = role;
        this.enabled = enabled;
    }

    public static AppUserPrincipal from(AppUser user) {
        return new AppUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getDisplayName(),
                user.getRole(),
                user.isEnabled()
        );
    }

    public Long getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public UserRole getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority("ROLE_" + role.name())
        );
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}