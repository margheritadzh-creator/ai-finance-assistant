package cs.sbs.web.personalprojectweb2026.service;

import cs.sbs.web.personalprojectweb2026.dto.expense.*;
import cs.sbs.web.personalprojectweb2026.entity.*;
import cs.sbs.web.personalprojectweb2026.entity.enums.ExpenseAnomalyLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.RecordBatchStatus;
import cs.sbs.web.personalprojectweb2026.entity.enums.RecordSource;
import cs.sbs.web.personalprojectweb2026.exception.ResourceNotFoundException;
import cs.sbs.web.personalprojectweb2026.repository.*;
import cs.sbs.web.personalprojectweb2026.service.validation.ExpenseAnomalyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ExpenseService {

    private final AppUserRepository appUserRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRecordRepository expenseRecordRepository;
    private final RecordBatchRepository recordBatchRepository;
    private final ExpenseAnomalyService anomalyService;

    public ExpenseService(
            AppUserRepository appUserRepository,
            CategoryRepository categoryRepository,
            ExpenseRecordRepository expenseRecordRepository,
            RecordBatchRepository recordBatchRepository,
            ExpenseAnomalyService anomalyService
    ) {
        this.appUserRepository = appUserRepository;
        this.categoryRepository = categoryRepository;
        this.expenseRecordRepository = expenseRecordRepository;
        this.recordBatchRepository = recordBatchRepository;
        this.anomalyService = anomalyService;
    }

    @Transactional(readOnly = true)
    public ExpenseAnomalyResponse checkAnomaly(
            Long userId,
            ExpenseUpsertRequest request
    ) {
        requireUser(userId);
        requireCategory(request.categoryId());

        return anomalyService.evaluate(
                userId,
                request.itemName(),
                request.amount(),
                request.quantity()
        );
    }

    @Transactional
    public ExpenseMutationResponse createExpense(
            Long userId,
            ExpenseUpsertRequest request
    ) {
        AppUser user = requireUser(userId);
        Category category = requireCategory(
                request.categoryId()
        );

        ExpenseAnomalyResponse anomaly =
                anomalyService.evaluate(
                        userId,
                        request.itemName(),
                        request.amount(),
                        request.quantity()
                );

        if (anomaly.requiresConfirmation()
                && !request.confirmAnomaly()) {
            return ExpenseMutationResponse
                    .confirmationRequired(anomaly);
        }

        ExpenseRecord expense = new ExpenseRecord();
        expense.setUser(user);
        expense.setCategory(category);

        applyRequest(
                expense,
                request,
                RecordSource.MANUAL
        );

        applyAnomaly(
                expense,
                anomaly,
                request.confirmAnomaly()
        );

        ExpenseRecord saved =
                expenseRecordRepository.save(expense);

        return ExpenseMutationResponse.saved(
                ExpenseResponse.from(saved),
                anomaly
        );
    }

    @Transactional
    public ExpenseMutationResponse updateExpense(
            Long userId,
            Long expenseId,
            ExpenseUpsertRequest request
    ) {
        ExpenseRecord expense = expenseRecordRepository
                .findByIdAndUser_Id(expenseId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "账单不存在"
                        )
                );

        Category category = requireCategory(
                request.categoryId()
        );

        ExpenseAnomalyResponse anomaly =
                anomalyService.evaluate(
                        userId,
                        request.itemName(),
                        request.amount(),
                        request.quantity()
                );

        if (anomaly.requiresConfirmation()
                && !request.confirmAnomaly()) {
            return ExpenseMutationResponse
                    .confirmationRequired(anomaly);
        }

        expense.setCategory(category);

        applyRequest(
                expense,
                request,
                expense.getSource()
        );

        applyAnomaly(
                expense,
                anomaly,
                request.confirmAnomaly()
        );

        return ExpenseMutationResponse.saved(
                ExpenseResponse.from(
                        expenseRecordRepository.save(expense)
                ),
                anomaly
        );
    }

    @Transactional
    public ExpenseBatchResponse createBatch(
            Long userId,
            ExpenseBatchCreateRequest request
    ) {
        AppUser user = requireUser(userId);

        List<Category> categories = new ArrayList<>();
        List<ExpenseAnomalyResponse> anomalies =
                new ArrayList<>();
        List<ExpenseBatchIssueResponse> issues =
                new ArrayList<>();

        for (int index = 0;
             index < request.expenses().size();
             index++) {

            ExpenseUpsertRequest item =
                    request.expenses().get(index);

            categories.add(
                    requireCategory(item.categoryId())
            );

            ExpenseAnomalyResponse anomaly =
                    anomalyService.evaluate(
                            userId,
                            item.itemName(),
                            item.amount(),
                            item.quantity()
                    );

            anomalies.add(anomaly);

            if (!"NONE".equals(anomaly.level())) {
                issues.add(
                        new ExpenseBatchIssueResponse(
                                index,
                                item.itemName(),
                                anomaly
                        )
                );
            }
        }

        boolean hasUnconfirmedWarning = issues.stream()
                .anyMatch(issue ->
                        issue.anomaly().requiresConfirmation()
                );

        if (hasUnconfirmedWarning
                && !request.confirmAnomalies()) {
            return ExpenseBatchResponse
                    .confirmationRequired(issues);
        }

        RecordSource batchSource =
                request.source() == null
                        ? RecordSource.MANUAL
                        : request.source();

        RecordBatch batch = new RecordBatch();
        batch.setUser(user);
        batch.setSource(batchSource);
        batch.setInputLanguage(
                request.inputLanguage() == null
                        ? "zh-CN"
                        : request.inputLanguage()
        );
        batch.setOriginalText(
                clean(request.originalText())
        );
        batch.setNormalizedText(
                clean(request.originalText())
        );
        batch.setItemCount(request.expenses().size());
        batch.setStatus(RecordBatchStatus.CONFIRMED);
        batch.setConfirmedAt(Instant.now());

        RecordBatch savedBatch =
                recordBatchRepository.save(batch);

        List<ExpenseRecord> records = new ArrayList<>();

        for (int index = 0;
             index < request.expenses().size();
             index++) {

            ExpenseUpsertRequest item =
                    request.expenses().get(index);

            ExpenseRecord expense = new ExpenseRecord();
            expense.setUser(user);
            expense.setCategory(categories.get(index));
            expense.setBatch(savedBatch);

            applyRequest(
                    expense,
                    item,
                    batchSource
            );

            applyAnomaly(
                    expense,
                    anomalies.get(index),
                    request.confirmAnomalies()
                            || item.confirmAnomaly()
            );

            records.add(expense);
        }

        List<ExpenseResponse> savedExpenses =
                expenseRecordRepository
                        .saveAll(records)
                        .stream()
                        .map(ExpenseResponse::from)
                        .toList();

        return ExpenseBatchResponse.saved(
                savedBatch.getId(),
                savedExpenses,
                issues
        );
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpense(
            Long userId,
            Long expenseId
    ) {
        return expenseRecordRepository
                .findByIdAndUser_Id(expenseId, userId)
                .map(ExpenseResponse::from)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "账单不存在"
                        )
                );
    }

    @Transactional(readOnly = true)
    public ExpensePageResponse getExpenses(
            Long userId,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(
                Math.max(size, 1),
                100
        );

        Pageable pageable = PageRequest.of(
                safePage,
                safeSize
        );

        Page<ExpenseRecord> result =
                expenseRecordRepository
                        .findAllByUser_IdOrderByOccurredAtDesc(
                                userId,
                                pageable
                        );

        return ExpensePageResponse.from(result);
    }

    @Transactional
    public void deleteExpense(
            Long userId,
            Long expenseId
    ) {
        ExpenseRecord expense = expenseRecordRepository
                .findByIdAndUser_Id(expenseId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "账单不存在"
                        )
                );

        expenseRecordRepository.delete(expense);
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

    private Category requireCategory(Long categoryId) {
        return categoryRepository
                .findByIdAndActiveTrue(categoryId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "消费分类不存在或已停用"
                        )
                );
    }

    private void applyRequest(
            ExpenseRecord expense,
            ExpenseUpsertRequest request,
            RecordSource defaultSource
    ) {
        expense.setItemName(request.itemName().trim());
        expense.setMerchant(clean(request.merchant()));
        expense.setAmount(request.amount());
        expense.setCurrency(
                request.currency() == null
                        ? "CNY"
                        : request.currency()
                        .trim()
                        .toUpperCase(Locale.ROOT)
        );
        expense.setQuantity(request.quantity());
        expense.setUnit(clean(request.unit()));
        expense.setOccurredAt(request.occurredAt());
        expense.setNote(clean(request.note()));
        expense.setSource(
                request.source() == null
                        ? defaultSource
                        : request.source()
        );
        expense.setRawText(clean(request.rawText()));
    }

    private void applyAnomaly(
            ExpenseRecord expense,
            ExpenseAnomalyResponse anomaly,
            boolean confirmed
    ) {
        ExpenseAnomalyLevel level =
                ExpenseAnomalyLevel.valueOf(
                        anomaly.level()
                );

        expense.setAnomalyLevel(level);
        expense.setAnomalyScore(
                anomaly.score() == null
                        ? BigDecimal.ZERO
                        : anomaly.score()
        );
        expense.setAnomalyMessage(
                anomaly.message()
        );
        expense.setAnomalyConfirmed(
                level == ExpenseAnomalyLevel.NONE
                        || confirmed
        );
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }
}