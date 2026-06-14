package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByCodeIgnoreCaseAndActiveTrue(String code);

    Optional<Category> findByIdAndActiveTrue(Long id);

    List<Category> findAllByActiveTrueOrderBySortOrderAsc();
}