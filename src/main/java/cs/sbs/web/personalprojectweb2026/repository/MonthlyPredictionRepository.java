package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.MonthlyPrediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MonthlyPredictionRepository
        extends JpaRepository<MonthlyPrediction, Long> {

    Optional<MonthlyPrediction>
    findByUser_IdAndTargetMonthAndModelVersion(
            Long userId,
            LocalDate targetMonth,
            String modelVersion
    );

    Optional<MonthlyPrediction>
    findFirstByUser_IdAndTargetMonthOrderByGeneratedAtDesc(
            Long userId,
            LocalDate targetMonth
    );

    List<MonthlyPrediction>
    findTop12ByUser_IdOrderByTargetMonthDescGeneratedAtDesc(Long userId);
}