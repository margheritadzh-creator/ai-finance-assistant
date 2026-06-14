package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.SavingAdvicePriority;
import cs.sbs.web.personalprojectweb2026.entity.enums.SavingAdviceStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "saving_advice")
public class SavingAdvice extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_score_id")
    private FinancialHealthScore healthScore;

    @Column(name = "target_month", nullable = false)
    private LocalDate targetMonth;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "content_markdown", nullable = false, columnDefinition = "TEXT")
    private String contentMarkdown;

    @Column(name = "expected_saving", precision = 14, scale = 2)
    private BigDecimal expectedSaving;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private SavingAdvicePriority priority = SavingAdvicePriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SavingAdviceStatus status = SavingAdviceStatus.ACTIVE;

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public FinancialHealthScore getHealthScore() {
        return healthScore;
    }

    public LocalDate getTargetMonth() {
        return targetMonth;
    }

    public String getTitle() {
        return title;
    }

    public String getContentMarkdown() {
        return contentMarkdown;
    }

    public BigDecimal getExpectedSaving() {
        return expectedSaving;
    }

    public SavingAdvicePriority getPriority() {
        return priority;
    }

    public SavingAdviceStatus getStatus() {
        return status;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setHealthScore(FinancialHealthScore healthScore) {
        this.healthScore = healthScore;
    }

    public void setTargetMonth(LocalDate targetMonth) {
        this.targetMonth = targetMonth;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setContentMarkdown(String contentMarkdown) {
        this.contentMarkdown = contentMarkdown;
    }

    public void setExpectedSaving(BigDecimal expectedSaving) {
        this.expectedSaving = expectedSaving;
    }

    public void setPriority(SavingAdvicePriority priority) {
        this.priority = priority;
    }

    public void setStatus(SavingAdviceStatus status) {
        this.status = status;
    }
}