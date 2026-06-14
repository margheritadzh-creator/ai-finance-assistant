package cs.sbs.web.personalprojectweb2026.controller;

import cs.sbs.web.personalprojectweb2026.dto.expense.*;
import cs.sbs.web.personalprojectweb2026.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(
            ExpenseService expenseService
    ) {
        this.expenseService = expenseService;
    }

    @PostMapping("/check")
    public ExpenseAnomalyResponse checkAnomaly(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExpenseUpsertRequest request
    ) {
        return expenseService.checkAnomaly(
                userId(jwt),
                request
        );
    }

    @PostMapping
    public ResponseEntity<ExpenseMutationResponse> createExpense(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExpenseUpsertRequest request
    ) {
        ExpenseMutationResponse response =
                expenseService.createExpense(
                        userId(jwt),
                        request
                );

        HttpStatus status = response.saved()
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity
                .status(status)
                .body(response);
    }

    @PostMapping("/batch")
    public ResponseEntity<ExpenseBatchResponse> createBatch(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExpenseBatchCreateRequest request
    ) {
        ExpenseBatchResponse response =
                expenseService.createBatch(
                        userId(jwt),
                        request
                );

        HttpStatus status = response.saved()
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity
                .status(status)
                .body(response);
    }

    @PutMapping("/{expenseId}")
    public ExpenseMutationResponse updateExpense(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long expenseId,
            @Valid @RequestBody ExpenseUpsertRequest request
    ) {
        return expenseService.updateExpense(
                userId(jwt),
                expenseId,
                request
        );
    }

    @GetMapping("/{expenseId}")
    public ExpenseResponse getExpense(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long expenseId
    ) {
        return expenseService.getExpense(
                userId(jwt),
                expenseId
        );
    }

    @GetMapping
    public ExpensePageResponse getExpenses(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return expenseService.getExpenses(
                userId(jwt),
                page,
                size
        );
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpense(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long expenseId
    ) {
        expenseService.deleteExpense(
                userId(jwt),
                expenseId
        );
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}