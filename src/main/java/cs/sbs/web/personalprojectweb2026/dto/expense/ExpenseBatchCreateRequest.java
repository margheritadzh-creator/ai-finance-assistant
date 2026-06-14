package cs.sbs.web.personalprojectweb2026.dto.expense;

import cs.sbs.web.personalprojectweb2026.entity.enums.RecordSource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ExpenseBatchCreateRequest(

        RecordSource source,

        @Pattern(
                regexp = "^(zh-CN|en-US)$",
                message = "输入语言只支持中文或英文"
        )
        String inputLanguage,

        @Size(max = 5000, message = "原始输入内容过长")
        String originalText,

        boolean confirmAnomalies,

        @NotEmpty(message = "请至少添加一条账单")
        @Size(max = 50, message = "一次最多添加50条账单")
        List<@Valid ExpenseUpsertRequest> expenses
) {
}