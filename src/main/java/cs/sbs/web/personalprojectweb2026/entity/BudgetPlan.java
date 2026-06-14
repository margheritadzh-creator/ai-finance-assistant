package cs.sbs.web.personalprojectweb2026.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "budget_plan")
public class BudgetPlan extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "budget_month", nullable = false)
    private LocalDate budgetMonth;

    @Column(name = "limit_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal limitAmount;

    @Column(name = "alert_ratio", nullable = false, precision = 5, scale = 4)
    private BigDecimal alertRatio = new BigDecimal("0.8000");

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public Category getCategory() {
        return category;
    }

    public LocalDate getBudgetMonth() {
        return budgetMonth;
    }

    public BigDecimal getLimitAmount() {
        return limitAmount;
    }

    public BigDecimal getAlertRatio() {
        return alertRatio;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public void setBudgetMonth(LocalDate budgetMonth) {
        this.budgetMonth = budgetMonth;
    }

    public void setLimitAmount(BigDecimal limitAmount) {
        this.limitAmount = limitAmount;
    }

    public void setAlertRatio(BigDecimal alertRatio) {
        this.alertRatio = alertRatio;
    }
}