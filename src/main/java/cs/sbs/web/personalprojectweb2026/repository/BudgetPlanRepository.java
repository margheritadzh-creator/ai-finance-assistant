package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.BudgetPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetPlanRepository extends JpaRepository<BudgetPlan, Long> {

    Optional<BudgetPlan> findByIdAndUser_Id(Long id, Long userId);

    Optional<BudgetPlan>
    findByUser_IdAndBudgetMonthAndCategoryIsNull(
            Long userId,
            LocalDate budgetMonth
    );

    Optional<BudgetPlan>
    findByUser_IdAndBudgetMonthAndCategory_Id(
            Long userId,
            LocalDate budgetMonth,
            Long categoryId
    );

    List<BudgetPlan>
    findAllByUser_IdAndBudgetMonthOrderByCategory_IdAsc(
            Long userId,
            LocalDate budgetMonth
    );
}