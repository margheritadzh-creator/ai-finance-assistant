package cs.sbs.web.personalprojectweb2026.controller;

import cs.sbs.web.personalprojectweb2026.dto.ai.ExpenseClassificationRequest;
import cs.sbs.web.personalprojectweb2026.dto.ai.ExpenseClassificationResponse;
import cs.sbs.web.personalprojectweb2026.dto.ai.ExpenseExtractionRequest;
import cs.sbs.web.personalprojectweb2026.dto.ai.ExpenseExtractionResponse;
import cs.sbs.web.personalprojectweb2026.service.ai.ExpenseClassificationService;
import cs.sbs.web.personalprojectweb2026.service.ai.ExpenseExtractionService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/expenses")
public class AiExpenseController {

    private final ExpenseExtractionService extractionService;
    private final ExpenseClassificationService classificationService;

    public AiExpenseController(
            ExpenseExtractionService extractionService,
            ExpenseClassificationService classificationService
    ) {
        this.extractionService = extractionService;
        this.classificationService = classificationService;
    }

    @PostMapping("/extract")
    public ExpenseExtractionResponse extract(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExpenseExtractionRequest request
    ) {
        return extractionService.extract(
                Long.valueOf(jwt.getSubject()),
                request
        );
    }

    @PostMapping("/classify")
    public ExpenseClassificationResponse classify(
            @Valid @RequestBody
            ExpenseClassificationRequest request
    ) {
        return classificationService.classify(request);
    }
}