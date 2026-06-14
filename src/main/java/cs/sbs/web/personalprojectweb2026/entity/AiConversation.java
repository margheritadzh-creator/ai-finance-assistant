package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.AiConversationStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "ai_conversation")
public class AiConversation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AiConversationStatus status = AiConversationStatus.ACTIVE;

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getTitle() {
        return title;
    }

    public AiConversationStatus getStatus() {
        return status;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setStatus(AiConversationStatus status) {
        this.status = status;
    }
}