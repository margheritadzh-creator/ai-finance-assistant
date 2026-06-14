import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
    title: "智财助手",
    description: "智能个人财务顾问",
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({
                                       children,
                                   }: RootLayoutProps) {
    return (
        <html lang="zh-CN">
        <body>{children}</body>
        </html>
    );
}