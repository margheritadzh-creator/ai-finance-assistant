package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.ExpenseRecord;
import cs.sbs.web.personalprojectweb2026.entity.enums.ExpenseAnomalyLevel;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class ExpenseRecordSpecifications {

    private ExpenseRecordSpecifications() {
    }

    public static Specification<ExpenseRecord> filteredBy(
            Long userId,
            String keyword,
            Long categoryId,
            Instant startInclusive,
            Instant endExclusive,
            ExpenseAnomalyLevel anomalyLevel,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {
        String normalizedKeyword =
                normalizeKeyword(keyword);

        BigDecimal lowerAmount = minAmount;
        BigDecimal upperAmount = maxAmount;

        if (lowerAmount != null
                && upperAmount != null
                && lowerAmount.compareTo(upperAmount) > 0) {
            BigDecimal temporary = lowerAmount;
            lowerAmount = upperAmount;
            upperAmount = temporary;
        }

        final BigDecimal safeMinAmount = lowerAmount;
        final BigDecimal safeMaxAmount = upperAmount;

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates =
                    new ArrayList<>();

            predicates.add(
                    criteriaBuilder.equal(
                            root.get("user").get("id"),
                            userId
                    )
            );

            if (normalizedKeyword != null) {
                String searchPattern =
                        "%"
                                + escapeLike(
                                normalizedKeyword
                        )
                                + "%";

                predicates.add(
                        criteriaBuilder.or(
                                criteriaBuilder.like(
                                        criteriaBuilder.lower(
                                                root.get(
                                                        "itemName"
                                                )
                                        ),
                                        searchPattern,
                                        '\\'
                                ),
                                criteriaBuilder.like(
                                        criteriaBuilder.lower(
                                                root.get(
                                                        "merchant"
                                                )
                                        ),
                                        searchPattern,
                                        '\\'
                                ),
                                criteriaBuilder.like(
                                        criteriaBuilder.lower(
                                                root.get(
                                                        "note"
                                                )
                                        ),
                                        searchPattern,
                                        '\\'
                                )
                        )
                );
            }

            if (categoryId != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("category")
                                        .get("id"),
                                categoryId
                        )
                );
            }

            if (startInclusive != null) {
                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(
                                root.get("occurredAt"),
                                startInclusive
                        )
                );
            }

            if (endExclusive != null) {
                predicates.add(
                        criteriaBuilder.lessThan(
                                root.get("occurredAt"),
                                endExclusive
                        )
                );
            }

            if (anomalyLevel != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                root.get("anomalyLevel"),
                                anomalyLevel
                        )
                );
            }

            if (safeMinAmount != null) {
                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(
                                root.get("amount"),
                                safeMinAmount
                        )
                );
            }

            if (safeMaxAmount != null) {
                predicates.add(
                        criteriaBuilder.lessThanOrEqualTo(
                                root.get("amount"),
                                safeMaxAmount
                        )
                );
            }

            return criteriaBuilder.and(
                    predicates.toArray(
                            Predicate[]::new
                    )
            );
        };
    }

    private static String normalizeKeyword(
            String keyword
    ) {
        if (keyword == null
                || keyword.isBlank()) {
            return null;
        }

        return keyword
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private static String escapeLike(
            String value
    ) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}