package cs.sbs.web.personalprojectweb2026.dto.ai;

import jakarta.validation.constraints.Size;

public record ConversationCreateRequest(

        @Size(max = 150, message = "会话标题不能超过150个字符")
        String title
) {
}