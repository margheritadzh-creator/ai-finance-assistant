package cs.sbs.web.personalprojectweb2026.dto.ai;

import java.util.List;

public record ExpenseExtractionResponse(
        String originalText,
        String inputLanguage,
        String model,
        int promptVersion,
        int itemCount,
        List<ExtractedExpenseDraft> expenses
) {
}