package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.SavingAdvice;
import cs.sbs.web.personalprojectweb2026.entity.enums.SavingAdviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SavingAdviceRepository
        extends JpaRepository<SavingAdvice, Long> {

    Optional<SavingAdvice> findByIdAndUser_Id(Long id, Long userId);

    List<SavingAdvice>
    findAllByUser_IdAndTargetMonthOrderByCreatedAtDesc(
            Long userId,
            LocalDate targetMonth
    );

    List<SavingAdvice>
    findAllByUser_IdAndStatusOrderByCreatedAtDesc(
            Long userId,
            SavingAdviceStatus status
    );
}