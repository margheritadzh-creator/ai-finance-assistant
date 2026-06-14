package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.UserRole;
import jakarta.persistence.*;

@Entity
@Table(name = "app_user")
public class AppUser extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, length = 160)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 60)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role = UserRole.USER;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public UserRole getRole() {
        return role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}