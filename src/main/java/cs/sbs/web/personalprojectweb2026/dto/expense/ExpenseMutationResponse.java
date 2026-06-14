package cs.sbs.web.personalprojectweb2026.dto.expense;

public record ExpenseMutationResponse(
        boolean saved,
        boolean confirmationRequired,
        ExpenseResponse expense,
        ExpenseAnomalyResponse anomaly
) {

    public static ExpenseMutationResponse saved(
            ExpenseResponse expense,
            ExpenseAnomalyResponse anomaly
    ) {
        return new ExpenseMutationResponse(
                true,
                false,
                expense,
                anomaly
        );
    }

    public static ExpenseMutationResponse confirmationRequired(
            ExpenseAnomalyResponse anomaly
    ) {
        return new ExpenseMutationResponse(
                false,
                true,
                null,
                anomaly
        );
    }
}