package cs.sbs.web.personalprojectweb2026.service.ai;

import cs.sbs.web.personalprojectweb2026.dto.ai.*;
import cs.sbs.web.personalprojectweb2026.dto.analytics.AnalyticsOverviewResponse;
import cs.sbs.web.personalprojectweb2026.entity.*;
import cs.sbs.web.personalprojectweb2026.entity.enums.AiConversationStatus;
import cs.sbs.web.personalprojectweb2026.entity.enums.AiMessageRole;
import cs.sbs.web.personalprojectweb2026.exception.AiProcessingException;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.*;
import cs.sbs.web.personalprojectweb2026.service.analytics.AnalyticsService;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
public class FinancialAdvisorService {

    private static final ZoneId ZONE_ID =
            ZoneId.of("Asia/Shanghai");

    private static final int HISTORY_LIMIT = 20;

    private final ChatClient chatClient;
    private final PromptTemplateService promptTemplateService;
    private final AppUserRepository appUserRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AnalyticsService analyticsService;
    private final String mainModel;

    public FinancialAdvisorService(
            ChatClient chatClient,
            PromptTemplateService promptTemplateService,
            AppUserRepository appUserRepository,
            UserPreferenceRepository preferenceRepository,
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository,
            AnalyticsService analyticsService,
            @Value("${spring.ai.anthropic.chat.options.model}")
            String mainModel
    ) {
        this.chatClient = chatClient;
        this.promptTemplateService = promptTemplateService;
        this.appUserRepository = appUserRepository;
        this.preferenceRepository = preferenceRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.analyticsService = analyticsService;
        this.mainModel = mainModel;
    }

    @Transactional
    public ConversationResponse createConversation(
            Long userId,
            ConversationCreateRequest request
    ) {
        AppUser user = requireUser(userId);

        String title = clean(request.title());

        AiConversation conversation = new AiConversation();
        conversation.setUser(user);
        conversation.setTitle(
                title == null
                        ? "新的财务对话"
                        : title
        );
        conversation.setStatus(
                AiConversationStatus.ACTIVE
        );

        return ConversationResponse.from(
                conversationRepository.save(conversation)
        );
    }

    @Transactional(readOnly = true)
    public ConversationPageResponse getConversations(
            Long userId,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(
                Math.max(size, 1),
                50
        );

        Page<AiConversation> result =
                conversationRepository
                        .findAllByUser_IdOrderByUpdatedAtDesc(
                                userId,
                                PageRequest.of(
                                        safePage,
                                        safeSize
                                )
                        );

        return ConversationPageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public List<AiMessageResponse> getMessages(
            Long userId,
            Long conversationId
    ) {
        requireConversation(userId, conversationId);

        return messageRepository
                .findAllByConversation_IdAndConversation_User_IdOrderByCreatedAtAscIdAsc(
                        conversationId,
                        userId
                )
                .stream()
                .map(AiMessageResponse::from)
                .toList();
    }

    @Transactional
    public ConversationResponse archiveConversation(
            Long userId,
            Long conversationId
    ) {
        AiConversation conversation =
                requireConversation(
                        userId,
                        conversationId
                );

        conversation.setStatus(
                AiConversationStatus.ARCHIVED
        );
        conversation.touch();

        return ConversationResponse.from(
                conversationRepository.save(conversation)
        );
    }

    public Flux<ServerSentEvent<FinancialChatStreamEvent>>
    streamReply(
            Long userId,
            Long conversationId,
            FinancialChatRequest request
    ) {
        AiConversation conversation =
                requireConversation(
                        userId,
                        conversationId
                );

        if (conversation.getStatus()
                == AiConversationStatus.ARCHIVED) {
            throw new IllegalArgumentException(
                    "已归档的会话不能继续发送消息"
            );
        }

        List<Map<String, Object>> previousMessages =
                loadRecentHistory(
                        userId,
                        conversationId
                );

        saveUserMessage(
                conversation,
                request.message().trim()
        );

        updateConversationTitle(
                conversation,
                request.message()
        );

        AnalyticsOverviewResponse analytics =
                analyticsService.getOverview(
                        userId,
                        LocalDate.now(ZONE_ID)
                                .withDayOfMonth(1)
                );

        Map<String, Object> variables =
                new LinkedHashMap<>();

        variables.put(
                "user_preference",
                preferenceContext(userId)
        );
        variables.put(
                "financial_context",
                analytics
        );
        variables.put(
                "conversation_history",
                previousMessages
        );
        variables.put(
                "user_message",
                request.message().trim()
        );

        PromptTemplateService.RenderedPrompt prompt =
                promptTemplateService.render(
                        PromptTemplateService.FINANCIAL_CHAT,
                        variables
                );

        Flux<String> contentFlux;

        try {
            contentFlux = chatClient.prompt()
                    .system(prompt.systemPrompt())
                    .user(prompt.userPrompt())
                    .options(
                            AnthropicChatOptions.builder()
                                    .model(mainModel)
                                    .temperature(0.2)
                                    .maxTokens(4096)
                                    .build()
                    )
                    .stream()
                    .content();
        } catch (Exception exception) {
            throw new AiProcessingException(
                    "AI财务顾问暂时不可用",
                    exception
            );
        }

        StringBuilder fullAnswer = new StringBuilder();

        Flux<ServerSentEvent<FinancialChatStreamEvent>>
                deltaEvents = contentFlux
                .filter(chunk ->
                        chunk != null && !chunk.isEmpty()
                )
                .doOnNext(fullAnswer::append)
                .map(chunk ->
                        event(
                                "delta",
                                FinancialChatStreamEvent.delta(
                                        conversationId,
                                        chunk
                                )
                        )
                );

        Mono<ServerSentEvent<FinancialChatStreamEvent>>
                completedEvent = Mono.fromCallable(() -> {
                    if (fullAnswer.length() == 0) {
                        throw new AiProcessingException(
                                "AI没有返回有效内容"
                        );
                    }

                    AiMessage savedMessage =
                            saveAssistantMessage(
                                    userId,
                                    conversationId,
                                    fullAnswer.toString()
                            );

                    return event(
                            "done",
                            FinancialChatStreamEvent.done(
                                    conversationId,
                                    savedMessage.getId()
                            )
                    );
                })
                .subscribeOn(Schedulers.boundedElastic());

        return Flux.concat(
                        Flux.just(
                                event(
                                        "start",
                                        FinancialChatStreamEvent.start(
                                                conversationId
                                        )
                                )
                        ),
                        deltaEvents,
                        completedEvent
                )
                .onErrorResume(exception ->
                        Flux.just(
                                event(
                                        "error",
                                        FinancialChatStreamEvent.error(
                                                conversationId,
                                                readableError(exception)
                                        )
                                )
                        )
                );
    }

    private void saveUserMessage(
            AiConversation conversation,
            String content
    ) {
        AiMessage message = new AiMessage();
        message.setConversation(conversation);
        message.setRole(AiMessageRole.USER);
        message.setContent(content);

        messageRepository.save(message);

        conversation.touch();
        conversationRepository.save(conversation);
    }

    private AiMessage saveAssistantMessage(
            Long userId,
            Long conversationId,
            String content
    ) {
        AiConversation conversation =
                requireConversation(
                        userId,
                        conversationId
                );

        AiMessage message = new AiMessage();
        message.setConversation(conversation);
        message.setRole(AiMessageRole.ASSISTANT);
        message.setContent(content.trim());
        message.setModelName(mainModel);

        AiMessage saved = messageRepository.save(message);

        conversation.touch();
        conversationRepository.save(conversation);

        return saved;
    }

    private List<Map<String, Object>> loadRecentHistory(
            Long userId,
            Long conversationId
    ) {
        List<AiMessage> messages =
                new ArrayList<>(
                        messageRepository
                                .findAllByConversation_IdAndConversation_User_IdOrderByCreatedAtDescIdDesc(
                                        conversationId,
                                        userId,
                                        PageRequest.of(
                                                0,
                                                HISTORY_LIMIT
                                        )
                                )
                                .getContent()
                );

        Collections.reverse(messages);

        return messages.stream()
                .map(message -> {
                    Map<String, Object> item =
                            new LinkedHashMap<>();

                    item.put(
                            "role",
                            message.getRole().name()
                    );
                    item.put(
                            "content",
                            message.getContent()
                    );

                    return item;
                })
                .toList();
    }

    private Map<String, Object> preferenceContext(
            Long userId
    ) {
        UserPreference preference = preferenceRepository
                .findByUser_Id(userId)
                .orElse(null);

        Map<String, Object> result =
                new LinkedHashMap<>();

        if (preference == null) {
            result.put("region", "全国");
            result.put("spendingLevel", "STANDARD");
            result.put("currency", "CNY");
            return result;
        }

        result.put(
                "region",
                preference.getRegionName()
        );
        result.put(
                "spendingLevel",
                preference.getSpendingLevel().name()
        );
        result.put(
                "monthlyIncome",
                preference.getMonthlyIncome()
        );
        result.put(
                "monthlyBudget",
                preference.getDefaultMonthlyBudget()
        );
        result.put(
                "currency",
                preference.getCurrency()
        );

        return result;
    }

    private void updateConversationTitle(
            AiConversation conversation,
            String message
    ) {
        if (!"新的财务对话".equals(
                conversation.getTitle()
        )) {
            return;
        }

        String title = message.trim();

        if (title.length() > 30) {
            title = title.substring(0, 30) + "…";
        }

        conversation.setTitle(title);
        conversation.touch();
        conversationRepository.save(conversation);
    }

    private AppUser requireUser(Long userId) {
        return appUserRepository
                .findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "当前用户不存在"
                        )
                );
    }

    private AiConversation requireConversation(
            Long userId,
            Long conversationId
    ) {
        return conversationRepository
                .findByIdAndUser_Id(
                        conversationId,
                        userId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "AI会话不存在"
                        )
                );
    }

    private ServerSentEvent<FinancialChatStreamEvent> event(
            String name,
            FinancialChatStreamEvent data
    ) {
        return ServerSentEvent
                .builder(data)
                .event(name)
                .build();
    }

    private String readableError(Throwable exception) {
        Throwable current = exception;

        while (current.getCause() != null) {
            current = current.getCause();
        }

        String message = current.getMessage();

        if (message == null || message.isBlank()) {
            return "AI生成过程中发生错误，请稍后重试";
        }

        return "AI生成过程中发生错误，请稍后重试";
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }

        String result = value.trim();
        return result.isEmpty() ? null : result;
    }
}