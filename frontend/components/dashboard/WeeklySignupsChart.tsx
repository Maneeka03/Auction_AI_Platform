"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { WeeklyPoint } from "@/types/dashboard";

const CEILING = 22;

export function WeeklySignupsChart({ data, changePercent }: { data: WeeklyPoint[]; changePercent: number }) {
  const chartData = data.map((point) => ({
    ...point,
    remainder: Math.max(CEILING - point.value, 0),
  }));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <h3 className="text-base font-semibold text-neutral-900">New Signups</h3>
        <select
          defaultValue="week"
          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <div className="mt-8 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral-200)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "var(--color-neutral-500)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => (name === "value" ? [`${value} signups`, ""] : [null, null])}
              contentStyle={{ borderRadius: 8, borderColor: "var(--color-neutral-200)", fontSize: 13 }}
              cursor={{ fill: "var(--color-neutral-100)" }}
            />
            <Bar dataKey="value" stackId="signups" fill="var(--color-brand-500)" radius={[0, 0, 8, 8]} maxBarSize={18} />
            <Bar dataKey="remainder" stackId="signups" fill="var(--color-neutral-200)" radius={[8, 8, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-center">
        <span className={changePercent >= 0 ? "font-medium text-success-500" : "font-medium text-danger-500"}>
          {changePercent >= 0 ? "↑" : "↓"} {Math.abs(changePercent)}%
        </span>{" "}
        <span className="text-neutral-500">from last week</span>
      </p>
    </div>
  );
}