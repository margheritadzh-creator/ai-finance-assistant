package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.FinancialHealthScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FinancialHealthScoreRepository
        extends JpaRepository<FinancialHealthScore, Long> {

    Optional<FinancialHealthScore>
    findByUser_IdAndScoreMonth(
            Long userId,
            LocalDate scoreMonth
    );

    List<FinancialHealthScore>
    findTop12ByUser_IdOrderByScoreMonthDesc(Long userId);
}