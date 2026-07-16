"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Select } from "@/components/ui/Select";
import type { CategoryMixDatum } from "@/types/dashboard";

export function CategoryMixDonut({ data }: { data: CategoryMixDatum[] }) {
  const [range, setRange] = useState("30");

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h3 className="text-base font-semibold text-neutral-900">Category Mix</h3>
        <Select
          value={range}
          onChange={setRange}
          size="sm"
          className="w-36"
          options={[
            { value: "30", label: "Last 30 Days" },
            { value: "90", label: "Last 90 Days" },
          ]}
        />
      </div>

      <div className="mt-2 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="percent" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value}%`, String(name)]}
              contentStyle={{ borderRadius: 8, borderColor: "var(--color-neutral-200)", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 space-y-2">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-neutral-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium text-neutral-900">{entry.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}