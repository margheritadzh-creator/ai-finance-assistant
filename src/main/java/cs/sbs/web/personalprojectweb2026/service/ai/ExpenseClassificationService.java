package cs.sbs.web.personalprojectweb2026.service.ai;

import cs.sbs.web.personalprojectweb2026.dto.ai.ExpenseClassificationRequest;
import cs.sbs.web.personalprojectweb2026.dto.ai.ExpenseClassificationResponse;
import cs.sbs.web.personalprojectweb2026.entity.Category;
import cs.sbs.web.personalprojectweb2026.exception.AiProcessingException;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.CategoryRepository;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ExpenseClassificationService {

    private final ChatClient chatClient;
    private final PromptTemplateService promptTemplateService;
    private final CategoryRepository categoryRepository;
    private final String fastModel;

    public ExpenseClassificationService(
            ChatClient chatClient,
            PromptTemplateService promptTemplateService,
            CategoryRepository categoryRepository,
            @Value("${app.ai.small-fast-model}")
            String fastModel
    ) {
        this.chatClient = chatClient;
        this.promptTemplateService = promptTemplateService;
        this.categoryRepository = categoryRepository;
        this.fastModel = fastModel;
    }

    public ExpenseClassificationResponse classify(
            ExpenseClassificationRequest request
    ) {
        List<Category> categories =
                categoryRepository
                        .findAllByActiveTrueOrderBySortOrderAsc();

        if (categories.isEmpty()) {
            throw new ResourceNotFoundException(
                    "系统中没有可用消费分类"
            );
        }

        Map<String, Object> variables = new LinkedHashMap<>();
        variables.put(
                "categories",
                categories.stream()
                        .map(this::categoryContext)
                        .toList()
        );
        variables.put("item_name", request.itemName().trim());
        variables.put("merchant", clean(request.merchant()));
        variables.put("note", clean(request.note()));
        variables.put("raw_text", clean(request.rawText()));

        PromptTemplateService.RenderedPrompt prompt =
                promptTemplateService.render(
                        PromptTemplateService
                                .EXPENSE_CLASSIFICATION,
                        variables
                );

        ModelClassificationResult result;

        try {
            result = chatClient.prompt()
                    .system(prompt.systemPrompt())
                    .user(prompt.userPrompt())
                    .options(
                            AnthropicChatOptions.builder()
                                    .model(fastModel)
                                    .temperature(0.1)
                                    .maxTokens(500)
                                    .build()
                    )
                    .call()
                    .entity(ModelClassificationResult.class);
        } catch (Exception exception) {
            throw new AiProcessingException(
                    "AI自动分类暂时不可用，请稍后重试",
                    exception
            );
        }

        if (result == null) {
            throw new AiProcessingException(
                    "AI没有返回有效的分类结果"
            );
        }

        Category category = findCategoryOrOther(
                result.categoryCode()
        );

        return new ExpenseClassificationResponse(
                category.getId(),
                category.getCode(),
                category.getNameZh(),
                normalizeConfidence(result.confidence()),
                clean(result.reason()),
                fastModel
        );
    }

    private Category findCategoryOrOther(String categoryCode) {
        if (categoryCode != null) {
            String normalizedCode = categoryCode
                    .trim()
                    .toUpperCase(Locale.ROOT);

            Category matched = categoryRepository
                    .findByCodeIgnoreCaseAndActiveTrue(
                            normalizedCode
                    )
                    .orElse(null);

            if (matched != null) {
                return matched;
            }
        }

        return categoryRepository
                .findByCodeIgnoreCaseAndActiveTrue("OTHER")
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "系统缺少OTHER分类"
                        )
                );
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

    private record ModelClassificationResult(
            String categoryCode,
            BigDecimal confidence,
            String reason
    ) {
    }
}