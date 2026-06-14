package cs.sbs.web.personalprojectweb2026.service;

import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetItemResponse;
import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetOverviewResponse;
import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetUpsertRequest;
import cs.sbs.web.personalprojectweb2026.entity.AppUser;
import cs.sbs.web.personalprojectweb2026.entity.BudgetPlan;
import cs.sbs.web.personalprojectweb2026.entity.Category;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.AppUserRepository;
import cs.sbs.web.personalprojectweb2026.repository.BudgetPlanRepository;
import cs.sbs.web.personalprojectweb2026.repository.CategoryRepository;
import cs.sbs.web.personalprojectweb2026.repository.ExpenseRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BudgetService {

    private static final ZoneId ZONE_ID =
            ZoneId.of("Asia/Shanghai");

    private static final BigDecimal DEFAULT_ALERT_RATIO =
            new BigDecimal("0.8000");

    private final AppUserRepository appUserRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetPlanRepository budgetPlanRepository;
    private final ExpenseRecordRepository expenseRecordRepository;

    public BudgetService(
            AppUserRepository appUserRepository,
            CategoryRepository categoryRepository,
            BudgetPlanRepository budgetPlanRepository,
            ExpenseRecordRepository expenseRecordRepository
    ) {
        this.appUserRepository = appUserRepository;
        this.categoryRepository = categoryRepository;
        this.budgetPlanRepository = budgetPlanRepository;
        this.expenseRecordRepository = expenseRecordRepository;
    }

    @Transactional
    public BudgetItemResponse upsertBudget(
            Long userId,
            BudgetUpsertRequest request
    ) {
        AppUser user = requireUser(userId);
        LocalDate month = normalizeMonth(request.budgetMonth());

        Category category = request.categoryId() == null
                ? null
                : requireCategory(request.categoryId());

        BudgetPlan budget = findExistingBudget(
                userId,
                month,
                category
        );

        if (budget == null) {
            budget = new BudgetPlan();
            budget.setUser(user);
            budget.setCategory(category);
            budget.setBudgetMonth(month);
        }

        budget.setLimitAmount(request.limitAmount());
        budget.setAlertRatio(request.alertRatio());

        BudgetPlan saved = budgetPlanRepository.save(budget);

        MonthWindow window = monthWindow(month);
        Map<Long, BigDecimal> categorySpending =
                categorySpending(
                        userId,
                        window.start(),
                        window.end()
                );

        BigDecimal totalSpent = zeroIfNull(
                expenseRecordRepository.sumAmountForPeriod(
                        userId,
                        window.start(),
                        window.end()
                )
        );

        return toResponse(
                saved,
                totalSpent,
                categorySpending
        );
    }

    @Transactional(readOnly = true)
    public BudgetOverviewResponse getOverview(
            Long userId,
            LocalDate requestedMonth
    ) {
        requireUser(userId);

        LocalDate month = normalizeMonth(requestedMonth);
        MonthWindow window = monthWindow(month);

        List<BudgetPlan> budgets =
                budgetPlanRepository
                        .findAllByUser_IdAndBudgetMonthOrderByCategory_IdAsc(
                                userId,
                                month
                        );

        BigDecimal totalSpent = zeroIfNull(
                expenseRecordRepository.sumAmountForPeriod(
                        userId,
                        window.start(),
                        window.end()
                )
        );

        Map<Long, BigDecimal> categorySpending =
                categorySpending(
                        userId,
                        window.start(),
                        window.end()
                );

        List<BudgetItemResponse> items = budgets.stream()
                .map(budget ->
                        toResponse(
                                budget,
                                totalSpent,
                                categorySpending
                        )
                )
                .toList();

        BudgetPlan totalPlan = budgets.stream()
                .filter(budget -> budget.getCategory() == null)
                .findFirst()
                .orElse(null);

        BigDecimal totalBudget;

        if (totalPlan != null) {
            totalBudget = totalPlan.getLimitAmount();
        } else {
            totalBudget = budgets.stream()
                    .filter(budget -> budget.getCategory() != null)
                    .map(BudgetPlan::getLimitAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal alertRatio = totalPlan == null
                ? DEFAULT_ALERT_RATIO
                : totalPlan.getAlertRatio();

        BigDecimal usageRatio = calculateRatio(
                totalSpent,
                totalBudget
        );

        return new BudgetOverviewResponse(
                month,
                scaleMoney(totalBudget),
                scaleMoney(totalSpent),
                scaleMoney(totalBudget.subtract(totalSpent)),
                usageRatio,
                budgetStatus(
                        totalSpent,
                        totalBudget,
                        alertRatio
                ),
                items
        );
    }

    @Transactional
    public void deleteBudget(
            Long userId,
            Long budgetId
    ) {
        BudgetPlan budget = budgetPlanRepository
                .findByIdAndUser_Id(budgetId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "预算记录不存在"
                        )
                );

        budgetPlanRepository.delete(budget);
    }

    private BudgetPlan findExistingBudget(
            Long userId,
            LocalDate month,
            Category category
    ) {
        if (category == null) {
            return budgetPlanRepository
                    .findByUser_IdAndBudgetMonthAndCategoryIsNull(
                            userId,
                            month
                    )
                    .orElse(null);
        }

        return budgetPlanRepository
                .findByUser_IdAndBudgetMonthAndCategory_Id(
                        userId,
                        month,
                        category.getId()
                )
                .orElse(null);
    }

    private BudgetItemResponse toResponse(
            BudgetPlan budget,
            BigDecimal totalSpent,
            Map<Long, BigDecimal> categorySpending
    ) {
        Category category = budget.getCategory();

        BigDecimal spent = category == null
                ? totalSpent
                : categorySpending.getOrDefault(
                category.getId(),
                BigDecimal.ZERO
        );

        BigDecimal usageRatio = calculateRatio(
                spent,
                budget.getLimitAmount()
        );

        return new BudgetItemResponse(
                budget.getId(),
                category == null ? null : category.getId(),
                category == null ? null : category.getCode(),
                category == null ? "总预算" : category.getNameZh(),
                budget.getBudgetMonth(),
                scaleMoney(budget.getLimitAmount()),
                budget.getAlertRatio().setScale(
                        4,
                        RoundingMode.HALF_UP
                ),
                scaleMoney(spent),
                scaleMoney(
                        budget.getLimitAmount().subtract(spent)
                ),
                usageRatio,
                budgetStatus(
                        spent,
                        budget.getLimitAmount(),
                        budget.getAlertRatio()
                )
        );
    }

    private Map<Long, BigDecimal> categorySpending(
            Long userId,
            Instant start,
            Instant end
    ) {
        Map<Long, BigDecimal> result = new HashMap<>();

        for (Object[] row :
                expenseRecordRepository
                        .summarizeByCategoryForPeriod(
                                userId,
                                start,
                                end
                        )) {

            Long categoryId = (Long) row[0];
            BigDecimal amount = (BigDecimal) row[3];

            result.put(categoryId, zeroIfNull(amount));
        }

        return result;
    }

    private String budgetStatus(
            BigDecimal spent,
            BigDecimal budget,
            BigDecimal alertRatio
    ) {
        if (budget == null
                || budget.compareTo(BigDecimal.ZERO) <= 0) {
            return "NO_BUDGET";
        }

        if (spent.compareTo(budget) > 0) {
            return "OVER_BUDGET";
        }

        BigDecimal usageRatio = calculateRatio(
                spent,
                budget
        );

        if (usageRatio.compareTo(alertRatio) >= 0) {
            return "ALERT";
        }

        return "NORMAL";
    }

    private BigDecimal calculateRatio(
            BigDecimal amount,
            BigDecimal total
    ) {
        if (total == null
                || total.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(4);
        }

        return amount.divide(
                total,
                4,
                RoundingMode.HALF_UP
        );
    }

    private LocalDate normalizeMonth(LocalDate date) {
        LocalDate value = date == null
                ? LocalDate.now(ZONE_ID)
                : date;

        return value.withDayOfMonth(1);
    }

    private MonthWindow monthWindow(LocalDate month) {
        Instant start = month
                .atStartOfDay(ZONE_ID)
                .toInstant();

        Instant end = month
                .plusMonths(1)
                .atStartOfDay(ZONE_ID)
                .toInstant();

        return new MonthWindow(start, end);
    }

    private AppUser requireUser(Long userId) {
        return appUserRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "当前用户不存在"
                        )
                );
    }

    private Category requireCategory(Long categoryId) {
        return categoryRepository
                .findByIdAndActiveTrue(categoryId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "消费分类不存在或已停用"
                        )
                );
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return zeroIfNull(value).setScale(
                2,
                RoundingMode.HALF_UP
        );
    }

    private record MonthWindow(
            Instant start,
            Instant end
    ) {
    }
}