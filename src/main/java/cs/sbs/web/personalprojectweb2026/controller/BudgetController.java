package cs.sbs.web.personalprojectweb2026.controller;

import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetItemResponse;
import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetOverviewResponse;
import cs.sbs.web.personalprojectweb2026.dto.budget.BudgetUpsertRequest;
import cs.sbs.web.personalprojectweb2026.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public BudgetItemResponse upsertBudget(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody BudgetUpsertRequest request
    ) {
        return budgetService.upsertBudget(
                userId(jwt),
                request
        );
    }

    @GetMapping("/overview")
    public BudgetOverviewResponse getOverview(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month
    ) {
        return budgetService.getOverview(
                userId(jwt),
                month
        );
    }

    @DeleteMapping("/{budgetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBudget(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long budgetId
    ) {
        budgetService.deleteBudget(
                userId(jwt),
                budgetId
        );
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}