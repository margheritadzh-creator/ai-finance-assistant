package cs.sbs.web.personalprojectweb2026.dto.expense;

import java.util.List;

public record ExpenseBatchResponse(
        boolean saved,
        boolean confirmationRequired,
        Long batchId,
        int itemCount,
        List<ExpenseResponse> expenses,
        List<ExpenseBatchIssueResponse> issues
) {

    public static ExpenseBatchResponse confirmationRequired(
            List<ExpenseBatchIssueResponse> issues
    ) {
        return new ExpenseBatchResponse(
                false,
                true,
                null,
                0,
                List.of(),
                issues
        );
    }

    public static ExpenseBatchResponse saved(
            Long batchId,
            List<ExpenseResponse> expenses,
            List<ExpenseBatchIssueResponse> issues
    ) {
        return new ExpenseBatchResponse(
                true,
                false,
                batchId,
                expenses.size(),
                expenses,
                issues
        );
    }
}