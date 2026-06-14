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
    loginSchema,
    type LoginFormValues,
} from "@/schemas/auth";
import type { AuthResponse } from "@/types/auth";

const initialValues: LoginFormValues = {
    email: "",
    password: "",
};

export default function LoginPage() {
    const router = useRouter();

    const [form, setForm] =
        useState<LoginFormValues>(initialValues);

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

        const parsed = loginSchema.safeParse(form);

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
                    "/api/auth/login",
                    {
                        method: "POST",
                        authenticated: false,
                        body: JSON.stringify(parsed.data),
                    },
                );

            saveAuth(response);
            router.replace("/dashboard");
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
                setFieldErrors(error.fieldErrors);
            } else {
                setErrorMessage("登录失败，请稍后重试");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell
            eyebrow="SECURE ACCESS"
            title="欢迎回来"
            description="登录后继续查看你的账单、预算状态和 AI 财务分析。"
            footer={
                <>
                    还没有账户？{" "}
                    <Link
                        href="/register"
                        className="font-semibold text-[#9b733a] transition hover:text-[#765326]"
                    >
                        创建账户
                    </Link>
                </>
            }
        >
            <form
                onSubmit={handleSubmit}
                className="space-y-5"
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
                        autoComplete="current-password"
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
                        placeholder="请输入密码"
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
                            正在登录
                        </>
                    ) : (
                        <>
                            登录账户
                            <ArrowRight
                                size={18}
                                className="text-[#dec79f]"
                            />
                        </>
                    )}
                </button>

                <div className="flex items-center gap-3 pt-1">
                    <div className="h-px flex-1 bg-[#e4e7ec]" />
                    <span className="text-[11px] tracking-[0.12em] text-[#9aa1ad]">
            ENCRYPTED CONNECTION
          </span>
                    <div className="h-px flex-1 bg-[#e4e7ec]" />
                </div>
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