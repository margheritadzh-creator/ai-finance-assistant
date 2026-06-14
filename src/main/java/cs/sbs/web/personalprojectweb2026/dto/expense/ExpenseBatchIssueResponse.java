package cs.sbs.web.personalprojectweb2026.dto.expense;

public record ExpenseBatchIssueResponse(
        int index,
        String itemName,
        ExpenseAnomalyResponse anomaly
) {
}