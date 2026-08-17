import Link from "next/link";
import type { WelcomeBannerData } from "@/types/dashboard";

interface WelcomeBannerProps extends WelcomeBannerData {
    name: string;
}

// export function WelcomeBanner({ name, message, primaryAction, secondaryAction }: WelcomeBannerProps) {
//     return (
//         <div 
//         // className="welcome-banner flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-200 dark:bg-white">
//             // className="welcome-banner flex flex-col gap-4 rounded-xl border border-neutral-800 bg-[#000000] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
//                 className="welcome-banner flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
//             <div>
//                 {/* <h2 className="text-xl font-semibold text-white dark:text-neutral-900"> */}
//                     <h2 className="text-xl font-semibold text-white">
//                     Welcome back, {name}</h2>
//                 {/* <p className="mt-1 text-sm text-neutral-300 dark:text-neutral-700"> */}
//                     <p className="mt-1 text-sm text-neutral-300">
//                     {message}</p>
//             </div>
//             <div className="flex shrink-0 gap-3">
//                 <Link href={primaryAction.href} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
//                     {primaryAction.label}
//                 </Link>
//                 <Link href={secondaryAction.href} className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 dark:border-neutral-200 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
//                     {secondaryAction.label}
//                 </Link>
//             </div>
//         </div>
//     );
// }
export function WelcomeBanner({
  name,
  message,
  primaryAction,
  secondaryAction,
}: WelcomeBannerProps) {
  return (
    // <div className="welcome-banner flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div 
    // className="welcome-banner flex flex-col gap-4 rounded-xl border border-neutral-800 bg-black p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-black p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 className="text-xl font-semibold text-white">
          Welcome back, {name}
        </h2>

        <p className="mt-1 text-sm text-neutral-300">
          {message}
        </p>
      </div>

      <div className="flex shrink-0 gap-3">
        <Link
          href={primaryAction.href}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {primaryAction.label}
        </Link>

        <Link
          href={secondaryAction.href}
          className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
        >
          {secondaryAction.label}
        </Link>
      </div>
    </div>
  );
}
