package cs.sbs.web.personalprojectweb2026.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FinancialChatRequest(

        @NotBlank(message = "请输入问题")
        @Size(max = 4000, message = "单条消息不能超过4000个字符")
        String message
) {
}