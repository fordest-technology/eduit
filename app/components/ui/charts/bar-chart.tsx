"use client";

import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { XYChartProps } from "./types";

export function BarChart<T>({ data, xField, yField, height = 400 }: XYChartProps<T>) {
    if (!data?.length) {
        return (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                role="img"
                aria-label="Bar chart showing data comparison"
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey={xField as string}
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => {
                        if (typeof value === 'string' && value.length > 15) {
                            return `${value.substring(0, 15)}...`;
                        }
                        return value;
                    }}
                />
                <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                    }}
                />
                <Bar
                    dataKey={yField as string}
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1000}
                    name="Value"
                />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
} 