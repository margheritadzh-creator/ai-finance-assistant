package cs.sbs.web.personalprojectweb2026.service.ai;

import cs.sbs.web.personalprojectweb2026.dto.ai.SavingAdviceResponse;
import cs.sbs.web.personalprojectweb2026.dto.analytics.AnalyticsOverviewResponse;
import cs.sbs.web.personalprojectweb2026.dto.analytics.ExpensePredictionResponse;
import cs.sbs.web.personalprojectweb2026.dto.analytics.FinancialHealthResponse;
import cs.sbs.web.personalprojectweb2026.entity.FinancialHealthScore;
import cs.sbs.web.personalprojectweb2026.entity.SavingAdvice;
import cs.sbs.web.personalprojectweb2026.entity.UserPreference;
import cs.sbs.web.personalprojectweb2026.entity.enums.FinancialHealthLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.SavingAdvicePriority;
import cs.sbs.web.personalprojectweb2026.entity.enums.SavingAdviceStatus;
import cs.sbs.web.personalprojectweb2026.exception.AiProcessingException;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.FinancialHealthScoreRepository;
import cs.sbs.web.personalprojectweb2026.repository.SavingAdviceRepository;
import cs.sbs.web.personalprojectweb2026.repository.UserPreferenceRepository;
import cs.sbs.web.personalprojectweb2026.service.analytics.AnalyticsService;
import cs.sbs.web.personalprojectweb2026.service.analytics.FinancialHealthService;
import cs.sbs.web.personalprojectweb2026.service.analytics.PredictionService;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SavingAdviceService {

    private static final ZoneId ZONE_ID =
            ZoneId.of("Asia/Shanghai");

    private final ChatClient chatClient;
    private final PromptTemplateService promptTemplateService;
    private final AnalyticsService analyticsService;
    private final PredictionService predictionService;
    private final FinancialHealthService financialHealthService;
    private final UserPreferenceRepository preferenceRepository;
    private final FinancialHealthScoreRepository healthScoreRepository;
    private final SavingAdviceRepository savingAdviceRepository;
    private final String mainModel;

    public SavingAdviceService(
            ChatClient chatClient,
            PromptTemplateService promptTemplateService,
            AnalyticsService analyticsService,
            PredictionService predictionService,
            FinancialHealthService financialHealthService,
            UserPreferenceRepository preferenceRepository,
            FinancialHealthScoreRepository healthScoreRepository,
            SavingAdviceRepository savingAdviceRepository,
            @Value("${spring.ai.anthropic.chat.options.model}")
            String mainModel
    ) {
        this.chatClient = chatClient;
        this.promptTemplateService = promptTemplateService;
        this.analyticsService = analyticsService;
        this.predictionService = predictionService;
        this.financialHealthService = financialHealthService;
        this.preferenceRepository = preferenceRepository;
        this.healthScoreRepository = healthScoreRepository;
        this.savingAdviceRepository = savingAdviceRepository;
        this.mainModel = mainModel;
    }

    @Transactional
    public SavingAdviceResponse generateAdvice(
            Long userId,
            LocalDate requestedMonth
    ) {
        LocalDate month = normalizeMonth(requestedMonth);

        ExpensePredictionResponse prediction =
                predictionService.generatePrediction(
                        userId,
                        month.plusMonths(1)
                );

        FinancialHealthResponse health =
                financialHealthService.calculateHealthScore(
                        userId,
                        month
                );

        AnalyticsOverviewResponse analytics =
                analyticsService.getOverview(
                        userId,
                        month
                );

        Map<String, Object> variables =
                new LinkedHashMap<>();

        variables.put(
                "user_preference",
                preferenceContext(userId)
        );
        variables.put(
                "budget_summary",
                analytics.budget()
        );
        variables.put(
                "expense_summary",
                analytics.summary()
        );
        variables.put(
                "category_statistics",
                analytics.categoryStatistics()
        );
        variables.put(
                "prediction",
                prediction
        );
        variables.put(
                "health_score",
                health
        );

        PromptTemplateService.RenderedPrompt prompt =
                promptTemplateService.render(
                        PromptTemplateService.SAVING_ADVICE,
                        variables
                );

        String content;

        try {
            content = chatClient.prompt()
                    .system(prompt.systemPrompt())
                    .user(prompt.userPrompt())
                    .options(
                            AnthropicChatOptions.builder()
                                    .model(mainModel)
                                    .temperature(0.2)
                                    .maxTokens(2048)
                                    .build()
                    )
                    .call()
                    .content();
        } catch (Exception exception) {
            throw new AiProcessingException(
                    "个性化省钱建议生成失败，请稍后重试",
                    exception
            );
        }

        if (content == null || content.isBlank()) {
            throw new AiProcessingException(
                    "AI没有返回有效的省钱建议"
            );
        }

        FinancialHealthScore healthScore =
                healthScoreRepository
                        .findByUser_IdAndScoreMonth(
                                userId,
                                month
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "财务健康评分不存在"
                                )
                        );

        SavingAdvice advice = new SavingAdvice();
        advice.setUser(healthScore.getUser());
        advice.setHealthScore(healthScore);
        advice.setTargetMonth(month);
        advice.setTitle(month.getYear()
                + "年"
                + month.getMonthValue()
                + "月个性化省钱建议");
        advice.setContentMarkdown(content.trim());
        advice.setPriority(
                determinePriority(
                        healthScore.getLevel()
                )
        );
        advice.setStatus(SavingAdviceStatus.ACTIVE);

        return SavingAdviceResponse.from(
                savingAdviceRepository.save(advice)
        );
    }

    @Transactional(readOnly = true)
    public List<SavingAdviceResponse> getAdviceHistory(
            Long userId,
            LocalDate requestedMonth
    ) {
        LocalDate month = normalizeMonth(requestedMonth);

        return savingAdviceRepository
                .findAllByUser_IdAndTargetMonthOrderByCreatedAtDesc(
                        userId,
                        month
                )
                .stream()
                .map(SavingAdviceResponse::from)
                .toList();
    }

    @Transactional
    public SavingAdviceResponse updateStatus(
            Long userId,
            Long adviceId,
            SavingAdviceStatus status
    ) {
        SavingAdvice advice = savingAdviceRepository
                .findByIdAndUser_Id(adviceId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "省钱建议不存在"
                        )
                );

        advice.setStatus(status);

        return SavingAdviceResponse.from(
                savingAdviceRepository.save(advice)
        );
    }

    private Map<String, Object> preferenceContext(
            Long userId
    ) {
        UserPreference preference = preferenceRepository
                .findByUser_Id(userId)
                .orElse(null);

        Map<String, Object> result = new LinkedHashMap<>();

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
                "priceIndex",
                preference.getPriceIndex()
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

    private SavingAdvicePriority determinePriority(
            FinancialHealthLevel level
    ) {
        return switch (level) {
            case RISK -> SavingAdvicePriority.HIGH;
            case FAIR -> SavingAdvicePriority.MEDIUM;
            case GOOD, EXCELLENT -> SavingAdvicePriority.LOW;
        };
    }

    private LocalDate normalizeMonth(
            LocalDate requestedMonth
    ) {
        LocalDate month = requestedMonth == null
                ? LocalDate.now(ZONE_ID)
                : requestedMonth;

        return month.withDayOfMonth(1);
    }
}