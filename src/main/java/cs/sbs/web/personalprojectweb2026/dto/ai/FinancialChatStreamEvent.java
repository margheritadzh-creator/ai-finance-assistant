package cs.sbs.web.personalprojectweb2026.dto.ai;

public record FinancialChatStreamEvent(
        String type,
        Long conversationId,
        Long messageId,
        String content
) {

    public static FinancialChatStreamEvent start(
            Long conversationId
    ) {
        return new FinancialChatStreamEvent(
                "start",
                conversationId,
                null,
                null
        );
    }

    public static FinancialChatStreamEvent delta(
            Long conversationId,
            String content
    ) {
        return new FinancialChatStreamEvent(
                "delta",
                conversationId,
                null,
                content
        );
    }

    public static FinancialChatStreamEvent done(
            Long conversationId,
            Long messageId
    ) {
        return new FinancialChatStreamEvent(
                "done",
                conversationId,
                messageId,
                null
        );
    }

    public static FinancialChatStreamEvent error(
            Long conversationId,
            String message
    ) {
        return new FinancialChatStreamEvent(
                "error",
                conversationId,
                null,
                message
        );
    }
}