package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.PromptTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PromptTemplateRepository
        extends JpaRepository<PromptTemplate, Long> {

    Optional<PromptTemplate> findByCodeAndActiveTrue(String code);

    List<PromptTemplate> findAllByCodeOrderByVersionDesc(String code);

    boolean existsByCodeAndVersion(String code, int version);
}