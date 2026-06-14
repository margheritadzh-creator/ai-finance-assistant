import { z } from "zod";

const positiveMoney = z
    .string()
    .trim()
    .min(1, "请输入消费金额")
    .refine(
        (value) => {
            const amount = Number(value);

            return (
                Number.isFinite(amount) &&
                amount > 0 &&
                amount <= 99999999.99
            );
        },
        "请输入大于0的合理金额",
    );

const optionalPositiveNumber = z
    .string()
    .trim()
    .refine(
        (value) => {
            if (value === "") {
                return true;
            }

            const numberValue = Number(value);

            return (
                Number.isFinite(numberValue) &&
                numberValue > 0
            );
        },
        "数量必须大于0",
    );

export const expenseFormSchema = z.object({
    categoryId: z
        .string()
        .min(1, "请选择消费分类"),

    itemName: z
        .string()
        .trim()
        .min(1, "请输入消费项目")
        .max(120, "消费项目不能超过120个字符"),

    merchant: z
        .string()
        .trim()
        .max(120, "商家名称不能超过120个字符"),

    amount: positiveMoney,

    quantity: optionalPositiveNumber,

    unit: z
        .string()
        .trim()
        .max(30, "单位不能超过30个字符"),

    occurredAt: z
        .string()
        .min(1, "请选择消费时间"),

    note: z
        .string()
        .trim()
        .max(500, "备注不能超过500个字符"),
});

export type ExpenseFormValues = z.infer<
    typeof expenseFormSchema
>;