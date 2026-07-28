import Link from "next/link";
import type { WelcomeBannerData } from "@/types/dashboard";

interface WelcomeBannerProps extends WelcomeBannerData {
    name: string;
}

export function WelcomeBanner({ name, message, primaryAction, secondaryAction }: WelcomeBannerProps) {
    return (
        <div className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-xl font-semibold text-white">Welcome back, {name}</h2>
                <p className="mt-1 text-sm text-neutral-300">{message}</p>
            </div>
            <div className="flex shrink-0 gap-3">
                <Link href={primaryAction.href} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                    {primaryAction.label}
                </Link>
                <Link href={secondaryAction.href} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15">
                    {secondaryAction.label}
                </Link>
            </div>
        </div>
    );
}