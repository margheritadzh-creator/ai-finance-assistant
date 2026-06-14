package cs.sbs.web.personalprojectweb2026.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExpenseClassificationRequest(

        @NotBlank(message = "请输入消费项目")
        @Size(max = 120, message = "消费项目不能超过120个字符")
        String itemName,

        @Size(max = 120, message = "商家名称不能超过120个字符")
        String merchant,

        @Size(max = 500, message = "备注不能超过500个字符")
        String note,

        @Size(max = 4000, message = "原始内容过长")
        String rawText
) {
}