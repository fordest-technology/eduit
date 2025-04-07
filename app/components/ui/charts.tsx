"use client";

import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
} from "recharts";

const COLORS = [
    "#2563eb", // blue-600
    "#16a34a", // green-600
    "#9333ea", // purple-600
    "#ea580c", // orange-600
    "#059669", // emerald-600
    "#0284c7", // sky-600
    "#dc2626", // red-600
    "#4f46e5", // indigo-600
    "#0891b2", // cyan-600
    "#c026d3", // fuchsia-600
];

interface ChartProps<T> {
    data: T[];
    height?: number;
}

interface XYChartProps<T> extends ChartProps<T> {
    xField: keyof T;
    yField: keyof T;
}

interface PieChartProps<T> extends ChartProps<T> {
    nameField: keyof T;
    valueField: keyof T;
}

export function LineChart<T>({ data, xField, yField, height = 400 }: XYChartProps<T>) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey={xField as string}
                    tickFormatter={(value) => {
                        if (value instanceof Date) {
                            return new Date(value).toLocaleDateString();
                        }
                        return value;
                    }}
                />
                <YAxis />
                <Tooltip
                    labelFormatter={(value) => {
                        if (value instanceof Date) {
                            return new Date(value).toLocaleDateString();
                        }
                        return value;
                    }}
                />
                <Line
                    type="monotone"
                    dataKey={yField as string}
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb" }}
                />
            </RechartsLineChart>
        </ResponsiveContainer>
    );
}

export function BarChart<T>({ data, xField, yField, height = 400 }: XYChartProps<T>) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xField as string} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={yField as string} fill="#2563eb" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}

export function PieChart<T>({ data, nameField, valueField, height = 400 }: PieChartProps<T>) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    nameKey={nameField as string}
                    dataKey={valueField as string}
                    cx="50%"
                    cy="50%"
                    outerRadius={height * 0.4}
                    fill="#8884d8"
                    label
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
} 