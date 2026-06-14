package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.RecordBatchStatus;
import cs.sbs.web.personalprojectweb2026.entity.enums.RecordSource;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "record_batch")
public class RecordBatch extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private RecordSource source;

    @Column(name = "input_language", nullable = false, length = 10)
    private String inputLanguage = "zh-CN";

    @Column(name = "original_text", columnDefinition = "TEXT")
    private String originalText;

    @Column(name = "normalized_text", columnDefinition = "TEXT")
    private String normalizedText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extracted_data", columnDefinition = "jsonb")
    private Map<String, Object> extractedData;

    @Column(name = "item_count", nullable = false)
    private int itemCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RecordBatchStatus status = RecordBatchStatus.DRAFT;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public RecordSource getSource() {
        return source;
    }

    public String getInputLanguage() {
        return inputLanguage;
    }

    public String getOriginalText() {
        return originalText;
    }

    public String getNormalizedText() {
        return normalizedText;
    }

    public Map<String, Object> getExtractedData() {
        return extractedData;
    }

    public int getItemCount() {
        return itemCount;
    }

    public RecordBatchStatus getStatus() {
        return status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setSource(RecordSource source) {
        this.source = source;
    }

    public void setInputLanguage(String inputLanguage) {
        this.inputLanguage = inputLanguage;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public void setNormalizedText(String normalizedText) {
        this.normalizedText = normalizedText;
    }

    public void setExtractedData(Map<String, Object> extractedData) {
        this.extractedData = extractedData;
    }

    public void setItemCount(int itemCount) {
        this.itemCount = itemCount;
    }

    public void setStatus(RecordBatchStatus status) {
        this.status = status;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public void setConfirmedAt(Instant confirmedAt) {
        this.confirmedAt = confirmedAt;
    }
}