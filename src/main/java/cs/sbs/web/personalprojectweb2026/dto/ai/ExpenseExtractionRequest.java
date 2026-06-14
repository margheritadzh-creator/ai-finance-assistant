package cs.sbs.web.personalprojectweb2026.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ExpenseExtractionRequest(

        @NotBlank(message = "请输入或识别消费内容")
        @Size(max = 5000, message = "消费内容不能超过5000个字符")
        String userText,

        @NotBlank(message = "请选择识别语言")
        @Pattern(
                regexp = "^(zh-CN|en-US)$",
                message = "识别语言只支持中文或英文"
        )
        String inputLanguage
) {
}