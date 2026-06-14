"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";

import {
    formatCompactAmount,
    formatShortMonth,
    toNumber,
} from "@/lib/format";
import type { MonthlyTrend } from "@/types/analytics";

interface MonthlyTrendChartProps {
    data: MonthlyTrend[];
}

export function MonthlyTrendChart({
                                      data,
                                  }: MonthlyTrendChartProps) {
    const chartData = data.map((item) => ({
        month: formatShortMonth(item.month),
        amount: toNumber(item.amount),
    }));

    const hasExpense = chartData.some(
        (item) => item.amount > 0,
    );

    if (!hasExpense) {
        return (
            <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4ead8] text-xl text-[#9b733a]">
                    ¥
                </div>

                <p className="mt-4 text-sm font-medium text-[#3e485b]">
                    暂无支出趋势
                </p>

                <p className="mt-2 text-xs leading-5 text-[#939aa6]">
                    添加账单后，这里会显示最近六个月的消费变化
                </p>
            </div>
        );
    }

    return (
        <div className="h-full min-h-[250px] w-full">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 18,
                        right: 16,
                        bottom: 0,
                        left: -12,
                    }}
                >
                    <defs>
                        <linearGradient
                            id="expense-area-gradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#b58d50"
                                stopOpacity={0.28}
                            />

                            <stop
                                offset="100%"
                                stopColor="#b58d50"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        vertical={false}
                        stroke="#e3e6eb"
                        strokeDasharray="5 7"
                    />

                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: "#8a92a0",
                            fontSize: 12,
                        }}
                        dy={10}
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={54}
                        tick={{
                            fill: "#8a92a0",
                            fontSize: 11,
                        }}
                        tickFormatter={formatCompactAmount}
                    />

                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#ad8244"
                        strokeWidth={2.5}
                        fill="url(#expense-area-gradient)"
                        activeDot={{
                            r: 5,
                            fill: "#ad8244",
                            stroke: "#ffffff",
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}