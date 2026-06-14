package cs.sbs.web.personalprojectweb2026.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(
        name = "prompt_template",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_prompt_template_version",
                        columnNames = {"code", "version"}
                )
        }
)
public class PromptTemplate extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 80)
    private String code;

    @Column(name = "version", nullable = false)
    private int version;

    @Column(name = "system_prompt", nullable = false, columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(name = "user_prompt_template", nullable = false, columnDefinition = "TEXT")
    private String userPromptTemplate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_schema", columnDefinition = "jsonb")
    private Map<String, Object> responseSchema;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "active", nullable = false)
    private boolean active;

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public int getVersion() {
        return version;
    }

    public String getSystemPrompt() {
        return systemPrompt;
    }

    public String getUserPromptTemplate() {
        return userPromptTemplate;
    }

    public Map<String, Object> getResponseSchema() {
        return responseSchema;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public void setSystemPrompt(String systemPrompt) {
        this.systemPrompt = systemPrompt;
    }

    public void setUserPromptTemplate(String userPromptTemplate) {
        this.userPromptTemplate = userPromptTemplate;
    }

    public void setResponseSchema(Map<String, Object> responseSchema) {
        this.responseSchema = responseSchema;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}