package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.SpendingLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.WarningLevel;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "user_preference")
public class UserPreference extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(name = "region_code", nullable = false, length = 32)
    private String regionCode = "CN";

    @Column(name = "region_name", nullable = false, length = 80)
    private String regionName = "全国";

    @Column(name = "price_index", nullable = false, precision = 5, scale = 2)
    private BigDecimal priceIndex = BigDecimal.ONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "spending_level", nullable = false, length = 20)
    private SpendingLevel spendingLevel = SpendingLevel.STANDARD;

    @Column(name = "monthly_income", precision = 14, scale = 2)
    private BigDecimal monthlyIncome;

    @Column(name = "default_monthly_budget", precision = 14, scale = 2)
    private BigDecimal defaultMonthlyBudget;

    @Column(name = "warning_enabled", nullable = false)
    private boolean warningEnabled = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "warning_level", nullable = false, length = 20)
    private WarningLevel warningLevel = WarningLevel.MEDIUM;

    @Column(name = "preferred_language", nullable = false, length = 10)
    private String preferredLanguage = "zh-CN";

    @Column(name = "speech_language", nullable = false, length = 10)
    private String speechLanguage = "zh-CN";

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "CNY";

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getRegionCode() {
        return regionCode;
    }

    public String getRegionName() {
        return regionName;
    }

    public BigDecimal getPriceIndex() {
        return priceIndex;
    }

    public SpendingLevel getSpendingLevel() {
        return spendingLevel;
    }

    public BigDecimal getMonthlyIncome() {
        return monthlyIncome;
    }

    public BigDecimal getDefaultMonthlyBudget() {
        return defaultMonthlyBudget;
    }

    public boolean isWarningEnabled() {
        return warningEnabled;
    }

    public WarningLevel getWarningLevel() {
        return warningLevel;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public String getSpeechLanguage() {
        return speechLanguage;
    }

    public String getCurrency() {
        return currency;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setRegionCode(String regionCode) {
        this.regionCode = regionCode;
    }

    public void setRegionName(String regionName) {
        this.regionName = regionName;
    }

    public void setPriceIndex(BigDecimal priceIndex) {
        this.priceIndex = priceIndex;
    }

    public void setSpendingLevel(SpendingLevel spendingLevel) {
        this.spendingLevel = spendingLevel;
    }

    public void setMonthlyIncome(BigDecimal monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }

    public void setDefaultMonthlyBudget(BigDecimal defaultMonthlyBudget) {
        this.defaultMonthlyBudget = defaultMonthlyBudget;
    }

    public void setWarningEnabled(boolean warningEnabled) {
        this.warningEnabled = warningEnabled;
    }

    public void setWarningLevel(WarningLevel warningLevel) {
        this.warningLevel = warningLevel;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public void setSpeechLanguage(String speechLanguage) {
        this.speechLanguage = speechLanguage;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}