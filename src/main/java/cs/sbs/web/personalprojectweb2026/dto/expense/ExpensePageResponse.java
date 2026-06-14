package cs.sbs.web.personalprojectweb2026.dto.expense;

import cs.sbs.web.personalprojectweb2026.entity.ExpenseRecord;
import org.springframework.data.domain.Page;

import java.util.List;

public record ExpensePageResponse(
        List<ExpenseResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {

    public static ExpensePageResponse from(
            Page<ExpenseRecord> result
    ) {
        return new ExpensePageResponse(
                result.getContent()
                        .stream()
                        .map(ExpenseResponse::from)
                        .toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isFirst(),
                result.isLast()
        );
    }
}