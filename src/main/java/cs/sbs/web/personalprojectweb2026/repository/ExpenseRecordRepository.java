package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.ExpenseRecord;
import cs.sbs.web.personalprojectweb2026.entity.enums.ExpenseAnomalyLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ExpenseRecordRepository
        extends JpaRepository<ExpenseRecord, Long>,
        JpaSpecificationExecutor<ExpenseRecord> {

    @EntityGraph(attributePaths = {"category", "batch"})
    Optional<ExpenseRecord> findByIdAndUser_Id(
            Long id,
            Long userId
    );

    @EntityGraph(attributePaths = {"category", "batch"})
    Page<ExpenseRecord> findAllByUser_IdOrderByOccurredAtDesc(
            Long userId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"category"})
    List<ExpenseRecord> findAllByBatch_IdAndUser_IdOrderByOccurredAtAsc(
            Long batchId,
            Long userId
    );

    @EntityGraph(attributePaths = {"category"})
    List<ExpenseRecord>
    findAllByUser_IdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtAsc(
            Long userId,
            Instant startInclusive,
            Instant endExclusive
    );

    List<ExpenseRecord>
    findTop20ByUser_IdAndItemNameIgnoreCaseOrderByOccurredAtDesc(
            Long userId,
            String itemName
    );

    long countByUser_IdAndOccurredAtGreaterThanEqualAndOccurredAtLessThan(
            Long userId,
            Instant startInclusive,
            Instant endExclusive
    );

    @Query("""
            SELECT SUM(expense.amount)
            FROM ExpenseRecord expense
            WHERE expense.user.id = :userId
              AND expense.occurredAt >= :startInclusive
              AND expense.occurredAt < :endExclusive
            """)
    BigDecimal sumAmountForPeriod(
            @Param("userId") Long userId,
            @Param("startInclusive") Instant startInclusive,
            @Param("endExclusive") Instant endExclusive
    );

    @Query("""
            SELECT expense.category.id,
                   expense.category.code,
                   expense.category.nameZh,
                   SUM(expense.amount),
                   COUNT(expense.id)
            FROM ExpenseRecord expense
            WHERE expense.user.id = :userId
              AND expense.occurredAt >= :startInclusive
              AND expense.occurredAt < :endExclusive
            GROUP BY expense.category.id,
                     expense.category.code,
                     expense.category.nameZh
            ORDER BY SUM(expense.amount) DESC
            """)
    List<Object[]> summarizeByCategoryForPeriod(
            @Param("userId") Long userId,
            @Param("startInclusive") Instant startInclusive,
            @Param("endExclusive") Instant endExclusive
    );

    @Query("""
            SELECT COUNT(expense.id)
            FROM ExpenseRecord expense
            WHERE expense.user.id = :userId
              AND expense.occurredAt >= :startInclusive
              AND expense.occurredAt < :endExclusive
              AND expense.anomalyLevel <> :normalLevel
            """)
    long countAnomaliesForPeriod(
            @Param("userId") Long userId,
            @Param("startInclusive") Instant startInclusive,
            @Param("endExclusive") Instant endExclusive,
            @Param("normalLevel") ExpenseAnomalyLevel normalLevel
    );
}