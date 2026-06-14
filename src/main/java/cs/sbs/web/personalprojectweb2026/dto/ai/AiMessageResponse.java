package cs.sbs.web.personalprojectweb2026.dto.ai;

import cs.sbs.web.personalprojectweb2026.entity.AiMessage;

import java.time.Instant;

public record AiMessageResponse(
        Long id,
        Long conversationId,
        String role,
        String content,
        String modelName,
        Integer promptTokens,
        Integer completionTokens,
        Instant createdAt
) {

    public static AiMessageResponse from(
            AiMessage message
    ) {
        return new AiMessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getRole().name(),
                message.getContent(),
                message.getModelName(),
                message.getPromptTokens(),
                message.getCompletionTokens(),
                message.getCreatedAt()
        );
    }
}