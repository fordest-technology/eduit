"use client";

import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { XYChartProps } from "./types";

export function LineChart<T>({ data, xField, yField, height = 400 }: XYChartProps<T>) {
    if (!data?.length) {
        return (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                role="img"
                aria-label="Line chart showing data trends over time"
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey={xField as string}
                    tickFormatter={(value) => {
                        if (value instanceof Date) {
                            return new Date(value).toLocaleDateString();
                        }
                        return value;
                    }}
                    stroke="#6b7280"
                    fontSize={12}
                />
                <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                    labelFormatter={(value) => {
                        if (value instanceof Date) {
                            return new Date(value).toLocaleDateString();
                        }
                        return value;
                    }}
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                    }}
                />
                <Line
                    type="monotone"
                    dataKey={yField as string}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                    name="Value"
                />
            </RechartsLineChart>
        </ResponsiveContainer>
    );
} 