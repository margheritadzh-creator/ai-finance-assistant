package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.PredictionAlgorithm;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "monthly_prediction",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_monthly_prediction",
                        columnNames = {"user_id", "target_month", "model_version"}
                )
        }
)
public class MonthlyPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "target_month", nullable = false)
    private LocalDate targetMonth;

    @Column(name = "predicted_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal predictedAmount;

    @Column(name = "lower_bound", precision = 14, scale = 2)
    private BigDecimal lowerBound;

    @Column(name = "upper_bound", precision = 14, scale = 2)
    private BigDecimal upperBound;

    @Enumerated(EnumType.STRING)
    @Column(name = "algorithm", nullable = false, length = 80)
    private PredictionAlgorithm algorithm;

    @Column(name = "model_version", nullable = false, length = 30)
    private String modelVersion;

    @Column(name = "based_on_months", nullable = false)
    private int basedOnMonths;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public LocalDate getTargetMonth() {
        return targetMonth;
    }

    public BigDecimal getPredictedAmount() {
        return predictedAmount;
    }

    public BigDecimal getLowerBound() {
        return lowerBound;
    }

    public BigDecimal getUpperBound() {
        return upperBound;
    }

    public PredictionAlgorithm getAlgorithm() {
        return algorithm;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public int getBasedOnMonths() {
        return basedOnMonths;
    }

    public String getExplanation() {
        return explanation;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setTargetMonth(LocalDate targetMonth) {
        this.targetMonth = targetMonth;
    }

    public void setPredictedAmount(BigDecimal predictedAmount) {
        this.predictedAmount = predictedAmount;
    }

    public void setLowerBound(BigDecimal lowerBound) {
        this.lowerBound = lowerBound;
    }

    public void setUpperBound(BigDecimal upperBound) {
        this.upperBound = upperBound;
    }

    public void setAlgorithm(PredictionAlgorithm algorithm) {
        this.algorithm = algorithm;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public void setBasedOnMonths(int basedOnMonths) {
        this.basedOnMonths = basedOnMonths;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }
}