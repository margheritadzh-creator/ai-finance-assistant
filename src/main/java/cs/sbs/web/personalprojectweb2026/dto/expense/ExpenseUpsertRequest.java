package cs.sbs.web.personalprojectweb2026.dto.expense;

import cs.sbs.web.personalprojectweb2026.entity.enums.RecordSource;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record ExpenseUpsertRequest(

        @NotNull(message = "请选择消费分类")
        @Positive(message = "分类编号必须为正数")
        Long categoryId,

        @NotBlank(message = "请输入消费项目")
        @Size(max = 120, message = "消费项目不能超过120个字符")
        String itemName,

        @Size(max = 120, message = "商家名称不能超过120个字符")
        String merchant,

        @NotNull(message = "请输入消费金额")
        @DecimalMin(value = "0.01", message = "消费金额必须大于0")
        @Digits(integer = 8, fraction = 2, message = "消费金额格式不正确")
        BigDecimal amount,

        @Pattern(
                regexp = "^[A-Z]{3}$",
                message = "币种必须为三个大写字母"
        )
        String currency,

        @DecimalMin(value = "0.01", message = "数量必须大于0")
        @Digits(integer = 8, fraction = 2, message = "数量格式不正确")
        BigDecimal quantity,

        @Size(max = 30, message = "单位不能超过30个字符")
        String unit,

        @NotNull(message = "请选择消费时间")
        @PastOrPresent(message = "消费时间不能晚于当前时间")
        Instant occurredAt,

        @Size(max = 500, message = "备注不能超过500个字符")
        String note,

        RecordSource source,

        @Size(max = 4000, message = "原始文本过长")
        String rawText,

        boolean confirmAnomaly
) {
}