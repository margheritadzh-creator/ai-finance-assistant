package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.PriceReferenceRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PriceReferenceRuleRepository
        extends JpaRepository<PriceReferenceRule, Long> {

    List<PriceReferenceRule>
    findAllByEnabledTrueOrderByNormalizedKeywordAsc();

    @Query(
            value = """
                    SELECT rule.*
                    FROM price_reference_rule rule
                    WHERE rule.enabled = TRUE
                      AND (
                          LOWER(:itemName)
                              LIKE '%' || LOWER(rule.normalized_keyword) || '%'
                          OR EXISTS (
                              SELECT 1
                              FROM jsonb_array_elements_text(rule.aliases)
                                   AS alias_entry(value)
                              WHERE LOWER(:itemName)
                                  LIKE '%' || LOWER(alias_entry.value) || '%'
                          )
                      )
                      AND (
                          rule.region_code IS NULL
                          OR rule.region_code = :regionCode
                      )
                      AND (
                          rule.spending_level IS NULL
                          OR rule.spending_level = :spendingLevel
                      )
                    ORDER BY
                      CASE
                          WHEN rule.region_code = :regionCode THEN 0
                          ELSE 1
                      END,
                      CASE
                          WHEN rule.spending_level = :spendingLevel THEN 0
                          ELSE 1
                      END,
                      rule.max_reasonable ASC
                    """,
            nativeQuery = true
    )
    List<PriceReferenceRule> findMatchingRules(
            @Param("itemName") String itemName,
            @Param("regionCode") String regionCode,
            @Param("spendingLevel") String spendingLevel
    );
}