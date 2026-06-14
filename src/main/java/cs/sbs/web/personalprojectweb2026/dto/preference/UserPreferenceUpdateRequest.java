package cs.sbs.web.personalprojectweb2026.dto.preference;

import cs.sbs.web.personalprojectweb2026.entity.enums.SpendingLevel;
import cs.sbs.web.personalprojectweb2026.entity.enums.WarningLevel;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record UserPreferenceUpdateRequest(

        @NotBlank(message = "请选择地区编码")
        @Size(max = 32, message = "地区编码不能超过32个字符")
        String regionCode,

        @NotBlank(message = "请输入地区名称")
        @Size(max = 80, message = "地区名称不能超过80个字符")
        String regionName,

        @NotNull(message = "请输入地区物价系数")
        @DecimalMin(value = "0.10", message = "地区物价系数不能低于0.10")
        @DecimalMax(value = "10.00", message = "地区物价系数不能高于10.00")
        BigDecimal priceIndex,

        @NotNull(message = "请选择消费水平")
        SpendingLevel spendingLevel,

        @DecimalMin(value = "0.00", message = "月收入不能为负数")
        @Digits(integer = 12, fraction = 2, message = "月收入格式不正确")
        BigDecimal monthlyIncome,

        @DecimalMin(value = "0.00", message = "月预算不能为负数")
        @Digits(integer = 12, fraction = 2, message = "月预算格式不正确")
        BigDecimal defaultMonthlyBudget,

        @NotNull(message = "请选择是否开启异常提醒")
        Boolean warningEnabled,

        @NotNull(message = "请选择异常提醒灵敏度")
        WarningLevel warningLevel,

        @NotBlank(message = "请选择页面语言")
        @Pattern(
                regexp = "^(zh-CN|en-US)$",
                message = "页面语言只支持中文或英文"
        )
        String preferredLanguage,

        @NotBlank(message = "请选择语音识别语言")
        @Pattern(
                regexp = "^(zh-CN|en-US)$",
                message = "语音识别语言只支持中文或英文"
        )
        String speechLanguage,

        @NotBlank(message = "请选择币种")
        @Pattern(
                regexp = "^[A-Z]{3}$",
                message = "币种必须为三个大写字母"
        )
        String currency
) {
}