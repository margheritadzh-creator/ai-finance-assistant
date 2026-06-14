"use client";

import {
    Bar,
    BarChart,
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
import type {
    MonthlyTrend,
} from "@/types/analytics";

interface MonthlyComparisonChartProps {
    data: MonthlyTrend[];
}

export function MonthlyComparisonChart({
                                           data,
                                       }: MonthlyComparisonChartProps) {
    const chartData = data.map((item) => ({
        month: formatShortMonth(item.month),
        amount: toNumber(item.amount),
    }));

    const hasData = chartData.some(
        (item) => item.amount > 0,
    );

    if (!hasData) {
        return (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-[#3e485b]">
                    暂无月度对比数据
                </p>

                <p className="mt-2 text-xs text-[#939aa6]">
                    持续记录账单后可查看支出变化
                </p>
            </div>
        );
    }

    return (
        <div className="h-[330px] w-full">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <BarChart
                    data={chartData}
                    margin={{
                        top: 15,
                        right: 12,
                        bottom: 0,
                        left: -10,
                    }}
                >
                    <CartesianGrid
                        vertical={false}
                        stroke="#e3e6eb"
                        strokeDasharray="5 7"
                    />

                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        tick={{
                            fill: "#838b99",
                            fontSize: 12,
                        }}
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={58}
                        tick={{
                            fill: "#838b99",
                            fontSize: 11,
                        }}
                        tickFormatter={formatCompactAmount}
                    />

                    <Bar
                        dataKey="amount"
                        fill="#ad8244"
                        radius={[7, 7, 0, 0]}
                        maxBarSize={62}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}