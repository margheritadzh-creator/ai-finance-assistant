package cs.sbs.web.personalprojectweb2026.dto.ai;

import cs.sbs.web.personalprojectweb2026.entity.AiConversation;
import org.springframework.data.domain.Page;

import java.util.List;

public record ConversationPageResponse(
        List<ConversationResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {

    public static ConversationPageResponse from(
            Page<AiConversation> result
    ) {
        return new ConversationPageResponse(
                result.getContent()
                        .stream()
                        .map(ConversationResponse::from)
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