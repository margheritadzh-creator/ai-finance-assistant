import { z } from "zod";

const optionalMoney = z
    .string()
    .trim()
    .refine(
        (value) => {
            if (value === "") {
                return true;
            }

            const amount = Number(value);

            return (
                Number.isFinite(amount) &&
                amount >= 0 &&
                amount <= 999999999999.99
            );
        },
        "请输入正确的金额",
    );

export const preferenceFormSchema = z.object({
    regionCode: z
        .string()
        .trim()
        .min(1, "请输入地区代码")
        .max(32, "地区代码不能超过32个字符"),

    regionName: z
        .string()
        .trim()
        .min(1, "请输入地区名称")
        .max(80, "地区名称不能超过80个字符"),

    priceIndex: z
        .string()
        .trim()
        .min(1, "请输入物价系数")
        .refine(
            (value) => {
                const numberValue = Number(value);

                return (
                    Number.isFinite(numberValue) &&
                    numberValue >= 0.1 &&
                    numberValue <= 10
                );
            },
            "物价系数应在0.1至10之间",
        ),

    spendingLevel: z.enum([
        "ECONOMICAL",
        "STANDARD",
        "COMFORTABLE",
        "PREMIUM",
        "CUSTOM",
    ]),

    monthlyIncome: optionalMoney,

    defaultMonthlyBudget: optionalMoney,

    warningEnabled: z.boolean(),

    warningLevel: z.enum([
        "LOW",
        "MEDIUM",
        "HIGH",
    ]),

    preferredLanguage: z.enum([
        "zh-CN",
        "en-US",
    ]),

    speechLanguage: z.enum([
        "zh-CN",
        "en-US",
    ]),
});

export const budgetFormSchema = z.object({
    categoryId: z
        .string()
        .refine(
            (value) =>
                value === "" ||
                (
                    Number.isInteger(Number(value)) &&
                    Number(value) > 0
                ),
            "消费分类不正确",
        ),

    limitAmount: z
        .string()
        .trim()
        .min(1, "请输入预算金额")
        .refine(
            (value) => {
                const amount = Number(value);

                return (
                    Number.isFinite(amount) &&
                    amount > 0 &&
                    amount <= 999999999999.99
                );
            },
            "预算金额必须大于0",
        ),

    alertRatio: z
        .string()
        .trim()
        .min(1, "请输入提醒比例")
        .refine(
            (value) => {
                const ratio = Number(value);

                return (
                    Number.isFinite(ratio) &&
                    ratio >= 0.1 &&
                    ratio <= 1
                );
            },
            "提醒比例应在10%至100%之间",
        ),
});

export type PreferenceFormValues = z.infer<
    typeof preferenceFormSchema
>;

export type BudgetFormValues = z.infer<
    typeof budgetFormSchema
>;