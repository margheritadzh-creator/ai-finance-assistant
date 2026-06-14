package cs.sbs.web.personalprojectweb2026.service.ai;

import cs.sbs.web.personalprojectweb2026.dto.ai.ExtractedExpenseDraft;
import cs.sbs.web.personalprojectweb2026.dto.ai.ExpenseExtractionRequest;
import cs.sbs.web.personalprojectweb2026.dto.ai.ExpenseExtractionResponse;
import cs.sbs.web.personalprojectweb2026.entity.Category;
import cs.sbs.web.personalprojectweb2026.entity.UserPreference;
import cs.sbs.web.personalprojectweb2026.exception.AiProcessingException;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.CategoryRepository;
import cs.sbs.web.personalprojectweb2026.repository.UserPreferenceRepository;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ExpenseExtractionService {

    private static final ZoneId ZONE_ID =
            ZoneId.of("Asia/Shanghai");

    private static final BigDecimal MAX_AMOUNT =
            new BigDecimal("99999999.99");

    private final ChatClient chatClient;
    private final PromptTemplateService promptTemplateService;
    private final CategoryRepository categoryRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final String mainModel;

    public ExpenseExtractionService(
            ChatClient chatClient,
            PromptTemplateService promptTemplateService,
            CategoryRepository categoryRepository,
            UserPreferenceRepository preferenceRepository,
            @Value(
                    "${spring.ai.anthropic.chat.options.model}"
            )
            String mainModel
    ) {
        this.chatClient = chatClient;
        this.promptTemplateService = promptTemplateService;
        this.categoryRepository = categoryRepository;
        this.preferenceRepository = preferenceRepository;
        this.mainModel = mainModel;
    }

    public ExpenseExtractionResponse extract(
            Long userId,
            ExpenseExtractionRequest request
    ) {
        List<Category> categories =
                categoryRepository
                        .findAllByActiveTrueOrderBySortOrderAsc();

        if (categories.isEmpty()) {
            throw new ResourceNotFoundException(
                    "系统中没有可用消费分类"
            );
        }

        Map<String, Category> categoryMap = categories.stream()
                .collect(
                        Collectors.toMap(
                                category -> category.getCode()
                                        .toUpperCase(Locale.ROOT),
                                Function.identity()
                        )
                );

        Category otherCategory = categoryMap.get("OTHER");

        if (otherCategory == null) {
            throw new ResourceNotFoundException(
                    "系统缺少OTHER分类"
            );
        }

        Instant referenceTime = Instant.now();

        Map<String, Object> variables = new LinkedHashMap<>();
        variables.put(
                "input_language",
                request.inputLanguage()
        );
        variables.put(
                "reference_time",
                referenceTime.toString()
        );
        variables.put(
                "categories",
                categories.stream()
                        .map(this::categoryContext)
                        .toList()
        );
        variables.put(
                "user_preference",
                preferenceContext(userId)
        );
        variables.put(
                "user_text",
                request.userText().trim()
        );

        PromptTemplateService.RenderedPrompt prompt =
                promptTemplateService.render(
                        PromptTemplateService.EXPENSE_EXTRACTION,
                        variables
                );

        ModelExtractionResult result;

        try {
            result = chatClient.prompt()
                    .system(prompt.systemPrompt())
                    .user(prompt.userPrompt())
                    .options(
                            AnthropicChatOptions.builder()
                                    .model(mainModel)
                                    .temperature(0.1)
                                    .maxTokens(4096)
                                    .build()
                    )
                    .call()
                    .entity(ModelExtractionResult.class);
        } catch (Exception exception) {
            throw new AiProcessingException(
                    "AI账单提取暂时不可用，请稍后重试",
                    exception
            );
        }

        if (result == null
                || result.transactions() == null
                || result.transactions().isEmpty()) {
            throw new AiProcessingException(
                    "没有从内容中识别到有效消费记录"
            );
        }

        if (result.transactions().size() > 50) {
            throw new AiProcessingException(
                    "一次最多识别50条消费记录"
            );
        }

        List<ExtractedExpenseDraft> expenses =
                result.transactions()
                        .stream()
                        .map(item ->
                                convertDraft(
                                        item,
                                        categoryMap,
                                        otherCategory,
                                        referenceTime
                                )
                        )
                        .toList();

        return new ExpenseExtractionResponse(
                request.userText().trim(),
                request.inputLanguage(),
                mainModel,
                prompt.version(),
                expenses.size(),
                expenses
        );
    }

    private ExtractedExpenseDraft convertDraft(
            ModelExpenseItem item,
            Map<String, Category> categoryMap,
            Category otherCategory,
            Instant referenceTime
    ) {
        String itemName = clean(item.itemName());

        if (itemName == null) {
            throw new AiProcessingException(
                    "AI返回了缺少消费项目的记录"
            );
        }

        BigDecimal amount = item.amount();

        if (amount == null
                || amount.compareTo(BigDecimal.ZERO) <= 0
                || amount.compareTo(MAX_AMOUNT) > 0) {
            throw new AiProcessingException(
                    "AI返回了不合理的消费金额"
            );
        }

        String requestedCategory = item.categoryCode() == null
                ? ""
                : item.categoryCode()
                .trim()
                .toUpperCase(Locale.ROOT);

        Category category = categoryMap.getOrDefault(
                requestedCategory,
                otherCategory
        );

        BigDecimal confidence = normalizeConfidence(
                item.confidence()
        );

        boolean categoryWasReplaced =
                !category.getCode()
                        .equalsIgnoreCase(requestedCategory);

        boolean requiresReview =
                categoryWasReplaced
                        || confidence.compareTo(
                        new BigDecimal("0.6500")
                ) < 0;

        return new ExtractedExpenseDraft(
                category.getId(),
                category.getCode(),
                category.getNameZh(),
                itemName,
                clean(item.merchant()),
                amount.setScale(2, RoundingMode.HALF_UP),
                normalizeCurrency(item.currency()),
                normalizeQuantity(item.quantity()),
                clean(item.unit()),
                parseOccurredAt(
                        item.occurredAt(),
                        referenceTime
                ),
                clean(item.note()),
                confidence,
                requiresReview
        );
    }

    private Map<String, Object> preferenceContext(Long userId) {
        UserPreference preference = preferenceRepository
                .findByUser_Id(userId)
                .orElse(null);

        Map<String, Object> result = new LinkedHashMap<>();

        if (preference == null) {
            result.put("regionCode", "CN");
            result.put("regionName", "全国");
            result.put("spendingLevel", "STANDARD");
            result.put("currency", "CNY");
            return result;
        }

        result.put(
                "regionCode",
                preference.getRegionCode()
        );
        result.put(
                "regionName",
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
                "currency",
                preference.getCurrency()
        );

        return result;
    }

    private Map<String, Object> categoryContext(
            Category category
    ) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("code", category.getCode());
        result.put("nameZh", category.getNameZh());
        result.put("nameEn", category.getNameEn());
        return result;
    }

    private Instant parseOccurredAt(
            String value,
            Instant fallback
    ) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        Instant parsed = tryParseInstant(value.trim());

        if (parsed == null) {
            return fallback;
        }

        if (parsed.isAfter(
                Instant.now().plusSeconds(300)
        )) {
            return fallback;
        }

        return parsed;
    }

    private Instant tryParseInstant(String value) {
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
        }

        try {
            return OffsetDateTime.parse(value).toInstant();
        } catch (DateTimeParseException ignored) {
        }

        try {
            return LocalDateTime.parse(value)
                    .atZone(ZONE_ID)
                    .toInstant();
        } catch (DateTimeParseException ignored) {
        }

        try {
            return LocalDate.parse(value)
                    .atStartOfDay(ZONE_ID)
                    .toInstant();
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private String normalizeCurrency(String value) {
        if (value == null || value.isBlank()) {
            return "CNY";
        }

        String currency = value
                .trim()
                .toUpperCase(Locale.ROOT);

        return currency.matches("^[A-Z]{3}$")
                ? currency
                : "CNY";
    }

    private BigDecimal normalizeQuantity(BigDecimal value) {
        if (value == null
                || value.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeConfidence(
            BigDecimal value
    ) {
        if (value == null) {
            return new BigDecimal("0.5000");
        }

        return value.max(BigDecimal.ZERO)
                .min(BigDecimal.ONE)
                .setScale(4, RoundingMode.HALF_UP);
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }

        String result = value.trim();
        return result.isEmpty() ? null : result;
    }

    private record ModelExtractionResult(
            List<ModelExpenseItem> transactions
    ) {
    }

    private record ModelExpenseItem(
            String itemName,
            String merchant,
            BigDecimal amount,
            String currency,
            BigDecimal quantity,
            String unit,
            String categoryCode,
            String occurredAt,
            String note,
            BigDecimal confidence
    ) {
    }
}