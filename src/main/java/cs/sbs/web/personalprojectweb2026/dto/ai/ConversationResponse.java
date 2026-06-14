package cs.sbs.web.personalprojectweb2026.dto.ai;

import cs.sbs.web.personalprojectweb2026.entity.AiConversation;

import java.time.Instant;

public record ConversationResponse(
        Long id,
        String title,
        String status,
        Instant createdAt,
        Instant updatedAt
) {

    public static ConversationResponse from(
            AiConversation conversation
    ) {
        return new ConversationResponse(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getStatus().name(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }
}