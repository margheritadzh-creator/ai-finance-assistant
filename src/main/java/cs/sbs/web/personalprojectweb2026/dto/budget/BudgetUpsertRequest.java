package cs.sbs.web.personalprojectweb2026.dto.budget;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetUpsertRequest(

        Long categoryId,

        @NotNull(message = "请选择预算月份")
        LocalDate budgetMonth,

        @NotNull(message = "请输入预算金额")
        @DecimalMin(value = "0.01", message = "预算金额必须大于0")
        @Digits(integer = 12, fraction = 2, message = "预算金额格式不正确")
        BigDecimal limitAmount,

        @NotNull(message = "请输入预算提醒比例")
        @DecimalMin(value = "0.10", message = "提醒比例不能低于0.10")
        @DecimalMax(value = "1.00", message = "提醒比例不能高于1.00")
        BigDecimal alertRatio
) {

    public BudgetUpsertRequest {
        if (categoryId != null && categoryId <= 0) {
            throw new IllegalArgumentException(
                    "分类编号必须为正数"
            );
        }
    }
}