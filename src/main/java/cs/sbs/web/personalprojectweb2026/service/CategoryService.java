package cs.sbs.web.personalprojectweb2026.service;

import cs.sbs.web.personalprojectweb2026.dto.expense.CategoryResponse;
import cs.sbs.web.personalprojectweb2026.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(
            CategoryRepository categoryRepository
    ) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository
                .findAllByActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }
}