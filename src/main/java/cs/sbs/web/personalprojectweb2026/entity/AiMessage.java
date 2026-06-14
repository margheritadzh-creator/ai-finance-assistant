package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.AiMessageRole;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "ai_message")
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private AiMessageRole role;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "prompt_tokens")
    private Integer promptTokens;

    @Column(name = "completion_tokens")
    private Integer completionTokens;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public AiConversation getConversation() {
        return conversation;
    }

    public AiMessageRole getRole() {
        return role;
    }

    public String getContent() {
        return content;
    }

    public String getModelName() {
        return modelName;
    }

    public Integer getPromptTokens() {
        return promptTokens;
    }

    public Integer getCompletionTokens() {
        return completionTokens;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setConversation(AiConversation conversation) {
        this.conversation = conversation;
    }

    public void setRole(AiMessageRole role) {
        this.role = role;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public void setPromptTokens(Integer promptTokens) {
        this.promptTokens = promptTokens;
    }

    public void setCompletionTokens(Integer completionTokens) {
        this.completionTokens = completionTokens;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}