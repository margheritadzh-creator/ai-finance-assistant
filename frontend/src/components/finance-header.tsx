"use client";

import Link from "next/link";
import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    BarChart3,
    Landmark,
    LayoutDashboard,
    LogOut,
    MessageCircle,
    Mic,
    PiggyBank,
    ReceiptText,
    RefreshCw,
    Settings,
} from "lucide-react";

import {
    clearAuth,
} from "@/lib/auth-storage";

interface FinanceHeaderProps {
    displayName: string;
    email: string;
    refreshing?: boolean;
    onRefresh?: () => void;
    onBeforeLogout?: () => void;
}

const navigationItems = [
    {
        href: "/dashboard",
        label: "财务总览",
        icon: LayoutDashboard,
    },
    {
        href: "/expenses",
        label: "账单管理",
        icon: ReceiptText,
    },
    {
        href: "/voice",
        label: "智能记账",
        icon: Mic,
    },
    {
        href: "/analytics",
        label: "财务分析",
        icon: BarChart3,
    },
    {
        href: "/settings",
        label: "财务设置",
        icon: Settings,
    },
    {
        href: "/advisor",
        label: "智能顾问",
        icon: MessageCircle,
    },
    {
        href: "/advice",
        label: "省钱建议",
        icon: PiggyBank,
    },
];

export function FinanceHeader({
                                  displayName,
                                  email,
                                  refreshing = false,
                                  onRefresh,
                                  onBeforeLogout,
                              }: FinanceHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();

    function logout() {
        onBeforeLogout?.();
        clearAuth();
        router.replace("/login");
    }

    return (
        <header className="finance-surface rounded-[23px] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <Link
                    href="/dashboard"
                    className="flex shrink-0 items-center gap-4"
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#09152f] text-[#dec79f] shadow-[0_10px_24px_rgba(9,21,47,0.18)]">
                        <Landmark size={21} />
                    </div>

                    <div>
                        <p className="font-semibold tracking-[0.12em] text-[#09152f]">
                            智财助手
                        </p>

                        <p className="mt-1 text-xs text-[#858d9b]">
                            智能个人财务管理中心
                        </p>
                    </div>
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-4 xl:items-end">
                    <nav className="flex flex-wrap gap-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;

                            const active =
                                pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={[
                                        "inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border px-3.5 text-xs font-medium transition",
                                        active
                                            ? "border-[#09152f] bg-[#09152f] text-white shadow-[0_8px_20px_rgba(9,21,47,0.16)]"
                                            : "border-[#dfe3e8] bg-white text-[#596273] hover:border-[#d1bd9b] hover:bg-[#fbf7ef] hover:text-[#80602f]",
                                    ].join(" ")}
                                >
                                    <Icon size={14} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex flex-wrap items-center gap-3">
                        {onRefresh && (
                            <button
                                type="button"
                                onClick={onRefresh}
                                disabled={refreshing}
                                className="finance-secondary-button"
                            >
                                <RefreshCw
                                    size={15}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                {refreshing
                                    ? "正在刷新"
                                    : "刷新数据"}
                            </button>
                        )}

                        <div className="text-left sm:text-right">
                            <p className="text-sm font-semibold text-[#253047]">
                                {displayName}
                            </p>

                            <p className="mt-0.5 text-xs text-[#8a92a0]">
                                {email}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={logout}
                            className="finance-secondary-button"
                        >
                            <LogOut size={15} />
                            退出登录
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}