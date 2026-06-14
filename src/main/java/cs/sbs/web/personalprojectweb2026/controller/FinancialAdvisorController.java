package cs.sbs.web.personalprojectweb2026.controller;

import cs.sbs.web.personalprojectweb2026.dto.ai.*;
import cs.sbs.web.personalprojectweb2026.entity.enums.SavingAdviceStatus;
import cs.sbs.web.personalprojectweb2026.service.ai.FinancialAdvisorService;
import cs.sbs.web.personalprojectweb2026.service.ai.SavingAdviceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ai/advisor")
public class FinancialAdvisorController {

    private final SavingAdviceService savingAdviceService;
    private final FinancialAdvisorService financialAdvisorService;

    public FinancialAdvisorController(
            SavingAdviceService savingAdviceService,
            FinancialAdvisorService financialAdvisorService
    ) {
        this.savingAdviceService = savingAdviceService;
        this.financialAdvisorService = financialAdvisorService;
    }

    @PostMapping("/advice")
    public SavingAdviceResponse generateAdvice(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month
    ) {
        return savingAdviceService.generateAdvice(
                userId(jwt),
                month
        );
    }

    @GetMapping("/advice")
    public List<SavingAdviceResponse> getAdviceHistory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate month
    ) {
        return savingAdviceService.getAdviceHistory(
                userId(jwt),
                month
        );
    }

    @PatchMapping("/advice/{adviceId}/status")
    public SavingAdviceResponse updateAdviceStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long adviceId,
            @RequestParam SavingAdviceStatus status
    ) {
        return savingAdviceService.updateStatus(
                userId(jwt),
                adviceId,
                status
        );
    }

    @PostMapping("/conversations")
    public ConversationResponse createConversation(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            ConversationCreateRequest request
    ) {
        return financialAdvisorService.createConversation(
                userId(jwt),
                request
        );
    }

    @GetMapping("/conversations")
    public ConversationPageResponse getConversations(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return financialAdvisorService.getConversations(
                userId(jwt),
                page,
                size
        );
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<AiMessageResponse> getMessages(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long conversationId
    ) {
        return financialAdvisorService.getMessages(
                userId(jwt),
                conversationId
        );
    }

    @PatchMapping(
            "/conversations/{conversationId}/archive"
    )
    public ConversationResponse archiveConversation(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long conversationId
    ) {
        return financialAdvisorService.archiveConversation(
                userId(jwt),
                conversationId
        );
    }

    @PostMapping(
            value = "/conversations/{conversationId}/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    public Flux<
            ServerSentEvent<FinancialChatStreamEvent>
            > streamReply(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long conversationId,
            @Valid @RequestBody FinancialChatRequest request
    ) {
        return financialAdvisorService.streamReply(
                userId(jwt),
                conversationId,
                request
        );
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}