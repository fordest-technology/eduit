export interface ChartProps<T> {
  data: T[];
  height?: number;
}

export interface XYChartProps<T> extends ChartProps<T> {
  xField: keyof T;
  yField: keyof T;
}

export interface PieChartProps<T> extends ChartProps<T> {
  nameField: keyof T;
  valueField: keyof T;
}

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(142.1 76.2% 36.3%)", // green-600
  "hsl(272.1 71.7% 47.1%)", // purple-600
  "hsl(24.6 95% 53.1%)", // orange-600
  "hsl(167.2 71.5% 29.4%)", // emerald-600
  "hsl(199 88.7% 39.4%)", // sky-600
  "hsl(0 72.2% 50.6%)", // red-600
  "hsl(226.2 100% 66.1%)", // indigo-600
  "hsl(189 94.5% 42.7%)", // cyan-600
  "hsl(292.2 84.1% 49%)", // fuchsia-600
] as const;
