import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { RibbonKpi } from "@/types/dashboard";

const ribbonColor: Record<RibbonKpi["accent"], string> = {
    brand: "bg-brand-500",
    success: "bg-success-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
};

const iconBg: Record<RibbonKpi["accent"], string> = {
    brand: "bg-brand-500/10 text-brand-600",
    success: "bg-success-500/10 text-success-500",
    amber: "bg-amber-500/10 text-amber-600",
    sky: "bg-sky-500/10 text-sky-600",
};

export function RibbonKpiCard({ label, value, changePercent, changeLabel, accent }: RibbonKpi) {
    
    const isPositive = changePercent >= 0;

    return (
        <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4">
            <span className={`absolute left-0 top-0 h-11 w-11 ${ribbonColor[accent]}`} style={{ clipPath: "polygon(0 0, 100% 0, 0 65%)" }}aria-hidden="true"/>
            <div className="flex items-start justify-between">
                <p className="pl-3 text-sm text-neutral-600">{label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg[accent]}`}>
                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </span>
            </div>
            <p className="pl-3 text-2xl font-semibold text-neutral-900">{value}</p>
            <p className="pl-3 text-xs">
                <span className={isPositive ? "font-medium text-success-500" : "font-medium text-danger-500"}>
                    {isPositive ? "↑" : "↓"} {Math.abs(changePercent)}%
                </span>{" "}
                <span className="text-neutral-500">{changeLabel}</span>
            </p>
        </div>
    );
}