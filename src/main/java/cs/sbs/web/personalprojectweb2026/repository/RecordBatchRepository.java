package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.RecordBatch;
import cs.sbs.web.personalprojectweb2026.entity.enums.RecordBatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RecordBatchRepository extends JpaRepository<RecordBatch, Long> {

    Optional<RecordBatch> findByIdAndUser_Id(Long id, Long userId);

    Page<RecordBatch> findAllByUser_IdOrderByCreatedAtDesc(
            Long userId,
            Pageable pageable
    );

    Page<RecordBatch> findAllByUser_IdAndStatusOrderByCreatedAtDesc(
            Long userId,
            RecordBatchStatus status,
            Pageable pageable
    );
}