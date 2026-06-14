package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.FinancialHealthLevel;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(
        name = "financial_health_score",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_health_score_user_month",
                        columnNames = {"user_id", "score_month"}
                )
        }
)
public class FinancialHealthScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "score_month", nullable = false)
    private LocalDate scoreMonth;

    @Column(name = "total_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "budget_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal budgetScore;

    @Column(name = "stability_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal stabilityScore;

    @Column(name = "saving_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal savingScore;

    @Column(name = "structure_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal structureScore;

    @Column(name = "risk_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false, length = 20)
    private FinancialHealthLevel level;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detail", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> detail = new HashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public LocalDate getScoreMonth() {
        return scoreMonth;
    }

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public BigDecimal getBudgetScore() {
        return budgetScore;
    }

    public BigDecimal getStabilityScore() {
        return stabilityScore;
    }

    public BigDecimal getSavingScore() {
        return savingScore;
    }

    public BigDecimal getStructureScore() {
        return structureScore;
    }

    public BigDecimal getRiskScore() {
        return riskScore;
    }

    public FinancialHealthLevel getLevel() {
        return level;
    }

    public Map<String, Object> getDetail() {
        return detail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setScoreMonth(LocalDate scoreMonth) {
        this.scoreMonth = scoreMonth;
    }

    public void setTotalScore(BigDecimal totalScore) {
        this.totalScore = totalScore;
    }

    public void setBudgetScore(BigDecimal budgetScore) {
        this.budgetScore = budgetScore;
    }

    public void setStabilityScore(BigDecimal stabilityScore) {
        this.stabilityScore = stabilityScore;
    }

    public void setSavingScore(BigDecimal savingScore) {
        this.savingScore = savingScore;
    }

    public void setStructureScore(BigDecimal structureScore) {
        this.structureScore = structureScore;
    }

    public void setRiskScore(BigDecimal riskScore) {
        this.riskScore = riskScore;
    }

    public void setLevel(FinancialHealthLevel level) {
        this.level = level;
    }

    public void setDetail(Map<String, Object> detail) {
        this.detail = detail;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}