"use client";

import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { PieChartProps, CHART_COLORS } from "./types";

export function PieChart<T>({ data, nameField, valueField, height = 400 }: PieChartProps<T>) {
    if (!data?.length) {
        return (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart role="img" aria-label="Pie chart showing data distribution">
                <Pie
                    data={data}
                    nameKey={nameField as string}
                    dataKey={valueField as string}
                    cx="50%"
                    cy="50%"
                    outerRadius={height * 0.4}
                    fill="hsl(var(--primary))"
                    label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={true}
                    isAnimationActive={true}
                    animationDuration={1000}
                >
                    {data.map((_, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                            aria-label={`Segment ${index + 1}`}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "Value"]}
                />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) =>
                        typeof value === 'string' && value.length > 20
                            ? `${value.substring(0, 20)}...`
                            : value
                    }
                />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
} 