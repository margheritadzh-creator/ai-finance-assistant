package cs.sbs.web.personalprojectweb2026.controller;

import cs.sbs.web.personalprojectweb2026.dto.expense.CategoryResponse;
import cs.sbs.web.personalprojectweb2026.service.CategoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(
            CategoryService categoryService
    ) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> getCategories() {
        return categoryService.getActiveCategories();
    }
}