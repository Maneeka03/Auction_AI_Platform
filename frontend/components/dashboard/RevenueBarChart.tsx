"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyRevenuePoint } from "@/types/dashboard";

interface RevenueBarChartProps {
  data: MonthlyRevenuePoint[];
  totalLabel: string;
  changePercent: number;
}

const CEILING = 400;

export function RevenueBarChart({ data, totalLabel, changePercent }: RevenueBarChartProps) {
  const isPositive = changePercent >= 0;
  const chartData = data.map((point) => ({
    ...point,
    remainder: Math.max(CEILING - point.value, 0),
  }));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <h3 className="text-base font-semibold text-neutral-900">Revenue</h3>
        <select
          defaultValue="2026"
          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
      </div>

      <p className="mt-3 text-1xl font-semibold text-neutral-900">{totalLabel}</p>
      <p className="text-sm">
        <span className={isPositive ? "font-medium text-success-500" : "font-medium text-danger-500"}>
          {isPositive ? "↑" : "↓"} {Math.abs(changePercent)}%
        </span>{" "}
        <span className="text-neutral-500">vs last year</span>
      </p>

      <div className="mt-8 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral-200)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[0, CEILING]}
              tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}k`}
            />
            <Tooltip
              formatter={(value, name) => (name === "value" ? [`$${value}k`, "Revenue"] : [null, null])}
              contentStyle={{ borderRadius: 8, borderColor: "var(--color-neutral-200)", fontSize: 13 }}
              cursor={{ fill: "var(--color-neutral-100)" }}
            />
            <Bar dataKey="value" stackId="revenue" fill="var(--color-brand-500)" radius={[0, 0, 8, 8]} maxBarSize={22} />
            <Bar dataKey="remainder" stackId="revenue" fill="var(--color-neutral-200)" radius={[8, 8, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}