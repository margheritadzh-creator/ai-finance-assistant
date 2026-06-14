"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    type FormEvent,
    type ReactNode,
    useState,
} from "react";

import {
    ArrowRight,
    LoaderCircle,
} from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { apiRequest, ApiError } from "@/lib/api";
import { saveAuth } from "@/lib/auth-storage";
import { getFieldErrors } from "@/lib/validation";
import {
    registerSchema,
    type RegisterFormValues,
} from "@/schemas/auth";
import type { AuthResponse } from "@/types/auth";

const initialValues: RegisterFormValues = {
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
};

export default function RegisterPage() {
    const router = useRouter();

    const [form, setForm] =
        useState<RegisterFormValues>(initialValues);

    const [fieldErrors, setFieldErrors] = useState<
        Record<string, string>
    >({});

    const [errorMessage, setErrorMessage] =
        useState("");

    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setErrorMessage("");
        setFieldErrors({});

        const parsed = registerSchema.safeParse(form);

        if (!parsed.success) {
            setFieldErrors(
                getFieldErrors(parsed.error),
            );
            return;
        }

        setLoading(true);

        try {
            const response =
                await apiRequest<AuthResponse>(
                    "/api/auth/register",
                    {
                        method: "POST",
                        authenticated: false,
                        body: JSON.stringify({
                            displayName: parsed.data.displayName,
                            email: parsed.data.email,
                            password: parsed.data.password,
                        }),
                    },
                );

            saveAuth(response);
            router.replace("/dashboard");
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
                setFieldErrors(error.fieldErrors);
            } else {
                setErrorMessage("注册失败，请稍后重试");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell
            eyebrow="PRIVATE ACCOUNT"
            title="创建财务账户"
            description="系统将为你建立独立的账单、预算、分析和 AI 顾问空间。"
            footer={
                <>
                    已经有账户？{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-[#9b733a] transition hover:text-[#765326]"
                    >
                        返回登录
                    </Link>
                </>
            }
        >
            <form
                onSubmit={handleSubmit}
                className="space-y-4"
                noValidate
            >
                {errorMessage && (
                    <div
                        role="alert"
                        className="rounded-[15px] border border-red-200 bg-red-50/80 px-4 py-3 text-sm leading-6 text-red-700"
                    >
                        {errorMessage}
                    </div>
                )}

                <FormField
                    label="昵称"
                    error={fieldErrors.displayName}
                >
                    <input
                        type="text"
                        name="displayName"
                        autoComplete="name"
                        value={form.displayName}
                        aria-invalid={Boolean(
                            fieldErrors.displayName,
                        )}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                displayName: event.target.value,
                            }))
                        }
                        placeholder="怎么称呼你"
                        className="finance-input"
                    />
                </FormField>

                <FormField
                    label="邮箱"
                    error={fieldErrors.email}
                >
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={form.email}
                        aria-invalid={Boolean(
                            fieldErrors.email,
                        )}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                email: event.target.value,
                            }))
                        }
                        placeholder="name@example.com"
                        className="finance-input"
                    />
                </FormField>

                <FormField
                    label="密码"
                    error={fieldErrors.password}
                >
                    <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        value={form.password}
                        aria-invalid={Boolean(
                            fieldErrors.password,
                        )}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                password: event.target.value,
                            }))
                        }
                        placeholder="至少8个字符"
                        className="finance-input"
                    />
                </FormField>

                <FormField
                    label="确认密码"
                    error={fieldErrors.confirmPassword}
                >
                    <input
                        type="password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        aria-invalid={Boolean(
                            fieldErrors.confirmPassword,
                        )}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                confirmPassword:
                                event.target.value,
                            }))
                        }
                        placeholder="再次输入密码"
                        className="finance-input"
                    />
                </FormField>

                <button
                    type="submit"
                    disabled={loading}
                    className="finance-primary-button"
                >
                    {loading ? (
                        <>
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                            正在创建账户
                        </>
                    ) : (
                        <>
                            创建账户
                            <ArrowRight
                                size={18}
                                className="text-[#dec79f]"
                            />
                        </>
                    )}
                </button>
            </form>
        </AuthShell>
    );
}

interface FormFieldProps {
    label: string;
    error?: string;
    children: ReactNode;
}

function FormField({
                       label,
                       error,
                       children,
                   }: FormFieldProps) {
    return (
        <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#344054]">
        {label}
      </span>

            {children}

            {error && (
                <span className="mt-2 block text-sm text-red-600">
          {error}
        </span>
            )}
        </label>
    );
}