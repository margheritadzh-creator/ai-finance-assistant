package cs.sbs.web.personalprojectweb2026.service.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import cs.sbs.web.personalprojectweb2026.entity.PromptTemplate;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.PromptTemplateRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PromptTemplateService {

    public static final String EXPENSE_EXTRACTION =
            "EXPENSE_EXTRACTION";

    public static final String EXPENSE_CLASSIFICATION =
            "EXPENSE_CLASSIFICATION";

    public static final String SAVING_ADVICE =
            "SAVING_ADVICE";

    public static final String FINANCIAL_CHAT =
            "FINANCIAL_CHAT";

    public static final String PREDICTION_EXPLANATION =
            "PREDICTION_EXPLANATION";

    public static final String ANOMALY_EXPLANATION =
            "ANOMALY_EXPLANATION";

    private static final Pattern VARIABLE_PATTERN =
            Pattern.compile("\\{\\{([A-Za-z0-9_]+)}}");

    private final PromptTemplateRepository repository;
    private final ObjectMapper objectMapper;

    public PromptTemplateService(
            PromptTemplateRepository repository,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public RenderedPrompt render(
            String code,
            Map<String, ?> variables
    ) {
        PromptTemplate template = repository
                .findByCodeAndActiveTrue(code)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "未找到启用的Prompt模板：" + code
                        )
                );

        return new RenderedPrompt(
                renderText(
                        template.getSystemPrompt(),
                        variables
                ),
                renderText(
                        template.getUserPromptTemplate(),
                        variables
                ),
                template.getVersion()
        );
    }

    private String renderText(
            String text,
            Map<String, ?> variables
    ) {
        Matcher matcher = VARIABLE_PATTERN.matcher(text);
        StringBuilder result = new StringBuilder();

        while (matcher.find()) {
            String variableName = matcher.group(1);

            if (!variables.containsKey(variableName)) {
                throw new IllegalArgumentException(
                        "Prompt缺少变量：" + variableName
                );
            }

            String replacement = serialize(
                    variables.get(variableName)
            );

            matcher.appendReplacement(
                    result,
                    Matcher.quoteReplacement(replacement)
            );
        }

        matcher.appendTail(result);
        return result.toString();
    }

    private String serialize(Object value) {
        if (value == null) {
            return "null";
        }

        if (value instanceof String stringValue) {
            return stringValue;
        }

        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException(
                    "Prompt变量无法序列化",
                    exception
            );
        }
    }

    public record RenderedPrompt(
            String systemPrompt,
            String userPrompt,
            int version
    ) {
    }
}