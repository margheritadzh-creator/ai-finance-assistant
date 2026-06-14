package cs.sbs.web.personalprojectweb2026.entity;

import cs.sbs.web.personalprojectweb2026.entity.enums.ExpenseAnomalyLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.RecordSource;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "expense_record")
public class ExpenseRecord extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private RecordBatch batch;

    @Column(name = "item_name", nullable = false, length = 120)
    private String itemName;

    @Column(name = "merchant", length = 120)
    private String merchant;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "CNY";

    @Column(name = "quantity", precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit", length = 30)
    private String unit;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "note", length = 500)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private RecordSource source;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "ai_confidence", precision = 5, scale = 4)
    private BigDecimal aiConfidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "anomaly_level", nullable = false, length = 20)
    private ExpenseAnomalyLevel anomalyLevel = ExpenseAnomalyLevel.NONE;

    @Column(name = "anomaly_score", precision = 5, scale = 4)
    private BigDecimal anomalyScore;

    @Column(name = "anomaly_message", length = 500)
    private String anomalyMessage;

    @Column(name = "anomaly_confirmed", nullable = false)
    private boolean anomalyConfirmed;

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public Category getCategory() {
        return category;
    }

    public RecordBatch getBatch() {
        return batch;
    }

    public String getItemName() {
        return itemName;
    }

    public String getMerchant() {
        return merchant;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public String getUnit() {
        return unit;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public String getNote() {
        return note;
    }

    public RecordSource getSource() {
        return source;
    }

    public String getRawText() {
        return rawText;
    }

    public BigDecimal getAiConfidence() {
        return aiConfidence;
    }

    public ExpenseAnomalyLevel getAnomalyLevel() {
        return anomalyLevel;
    }

    public BigDecimal getAnomalyScore() {
        return anomalyScore;
    }

    public String getAnomalyMessage() {
        return anomalyMessage;
    }

    public boolean isAnomalyConfirmed() {
        return anomalyConfirmed;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public void setBatch(RecordBatch batch) {
        this.batch = batch;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public void setMerchant(String merchant) {
        this.merchant = merchant;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public void setSource(RecordSource source) {
        this.source = source;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }

    public void setAiConfidence(BigDecimal aiConfidence) {
        this.aiConfidence = aiConfidence;
    }

    public void setAnomalyLevel(ExpenseAnomalyLevel anomalyLevel) {
        this.anomalyLevel = anomalyLevel;
    }

    public void setAnomalyScore(BigDecimal anomalyScore) {
        this.anomalyScore = anomalyScore;
    }

    public void setAnomalyMessage(String anomalyMessage) {
        this.anomalyMessage = anomalyMessage;
    }

    public void setAnomalyConfirmed(boolean anomalyConfirmed) {
        this.anomalyConfirmed = anomalyConfirmed;
    }
}