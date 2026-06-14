import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .email("请输入正确的邮箱地址")
        .max(254, "邮箱地址过长"),

    password: z
        .string()
        .min(1, "请输入密码")
        .max(72, "密码不能超过72个字符"),
});

export const registerSchema = z
    .object({
        displayName: z
            .string()
            .trim()
            .min(1, "请输入昵称")
            .max(60, "昵称不能超过60个字符"),

        email: z
            .email("请输入正确的邮箱地址")
            .max(254, "邮箱地址过长"),

        password: z
            .string()
            .min(8, "密码至少需要8个字符")
            .max(72, "密码不能超过72个字符"),

        confirmPassword: z
            .string()
            .min(1, "请再次输入密码"),
    })
    .refine(
        (value) =>
            value.password === value.confirmPassword,
        {
            path: ["confirmPassword"],
            message: "两次输入的密码不一致",
        },
    );

export type LoginFormValues = z.infer<
    typeof loginSchema
>;

export type RegisterFormValues = z.infer<
    typeof registerSchema
>;