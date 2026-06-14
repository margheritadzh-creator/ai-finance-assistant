package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.ExpenseAnomalyLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.SpendingLevel;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "price_reference_rule")
public class PriceReferenceRule extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "normalized_keyword", nullable = false, length = 120)
    private String normalizedKeyword;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "aliases", nullable = false, columnDefinition = "jsonb")
    private List<String> aliases = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "region_code", length = 32)
    private String regionCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "spending_level", length = 20)
    private SpendingLevel spendingLevel;

    @Column(name = "unit", length = 30)
    private String unit;

    @Column(name = "min_reasonable", precision = 14, scale = 2)
    private BigDecimal minReasonable;

    @Column(name = "max_reasonable", nullable = false, precision = 14, scale = 2)
    private BigDecimal maxReasonable;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private ExpenseAnomalyLevel severity = ExpenseAnomalyLevel.WARNING;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    public Long getId() {
        return id;
    }

    public String getNormalizedKeyword() {
        return normalizedKeyword;
    }

    public List<String> getAliases() {
        return aliases;
    }

    public Category getCategory() {
        return category;
    }

    public String getRegionCode() {
        return regionCode;
    }

    public SpendingLevel getSpendingLevel() {
        return spendingLevel;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getMinReasonable() {
        return minReasonable;
    }

    public BigDecimal getMaxReasonable() {
        return maxReasonable;
    }

    public ExpenseAnomalyLevel getSeverity() {
        return severity;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setNormalizedKeyword(String normalizedKeyword) {
        this.normalizedKeyword = normalizedKeyword;
    }

    public void setAliases(List<String> aliases) {
        this.aliases = aliases;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public void setRegionCode(String regionCode) {
        this.regionCode = regionCode;
    }

    public void setSpendingLevel(SpendingLevel spendingLevel) {
        this.spendingLevel = spendingLevel;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public void setMinReasonable(BigDecimal minReasonable) {
        this.minReasonable = minReasonable;
    }

    public void setMaxReasonable(BigDecimal maxReasonable) {
        this.maxReasonable = maxReasonable;
    }

    public void setSeverity(ExpenseAnomalyLevel severity) {
        this.severity = severity;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}