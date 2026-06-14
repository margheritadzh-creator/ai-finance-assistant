"use client";

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
} from "recharts";

import {
    formatCurrency,
    formatPercentage,
    toNumber,
} from "@/lib/format";
import type {
    CategoryStatistics,
} from "@/types/analytics";

interface CategoryDonutChartProps {
    data: CategoryStatistics[];
}

const chartColors = [
    "#a77b3f",
    "#385a8d",
    "#756088",
    "#687569",
    "#a56652",
    "#778092",
    "#b89962",
    "#58677e",
];

export function CategoryDonutChart({
                                       data,
                                   }: CategoryDonutChartProps) {
    const chartData = data
        .filter((item) => toNumber(item.amount) > 0)
        .map((item) => ({
            ...item,
            amount: toNumber(item.amount),
            percentage: toNumber(
                item.percentage,
            ),
        }));

    const totalAmount = chartData.reduce(
        (sum, item) => sum + item.amount,
        0,
    );

    if (chartData.length === 0) {
        return (
            <div className="flex min-h-[310px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4ead8] text-xl font-semibold text-[#9b733a]">
                    ¥
                </div>

                <p className="mt-4 text-sm font-medium text-[#3e485b]">
                    暂无消费分类数据
                </p>

                <p className="mt-2 text-xs leading-5 text-[#939aa6]">
                    添加账单后，这里会展示各类消费占比
                </p>
            </div>
        );
    }

    return (
        <div className="grid items-center gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="relative h-[280px]">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="amount"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            innerRadius={72}
                            outerRadius={108}
                            paddingAngle={3}
                            stroke="none"
                        >
                            {chartData.map(
                                (item, index) => (
                                    <Cell
                                        key={item.categoryId}
                                        fill={
                                            chartColors[
                                            index %
                                            chartColors.length
                                                ]
                                        }
                                    />
                                ),
                            )}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-[#8b93a0]">
                        本月总支出
                    </p>

                    <p className="mt-2 text-xl font-semibold text-[#172033]">
                        {formatCurrency(totalAmount)}
                    </p>

                    <p className="mt-1 text-[11px] text-[#a0a6b0]">
                        {chartData.length}个消费分类
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {chartData.map((item, index) => (
                    <div
                        key={item.categoryId}
                        className="flex items-center justify-between gap-4"
                    >
                        <div className="flex min-w-0 items-center gap-3">
              <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                      backgroundColor:
                          chartColors[
                          index %
                          chartColors.length
                              ],
                  }}
              />

                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[#344054]">
                                    {item.categoryName}
                                </p>

                                <p className="mt-1 text-[11px] text-[#9299a5]">
                                    {item.expenseCount}笔消费
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-[#253047]">
                                {formatCurrency(item.amount)}
                            </p>

                            <p className="mt-1 text-[11px] text-[#9b733a]">
                                {formatPercentage(
                                    item.percentage,
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}