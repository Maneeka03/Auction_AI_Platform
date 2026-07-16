// --- Super Admin dashboard (welcome banner + ribbon KPIs + list panels) ---

export interface WelcomeBannerData {
  message: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
}

export interface RibbonKpi {
  label: string;
  value: string;
  changePercent: number;
  changeLabel: string;
  accent: "brand" | "success" | "amber" | "sky";
}

export interface WeeklyPoint {
  day: string;
  value: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  value: number;
}

export interface CategoryMixDatum {
  name: string;
  percent: number;
  color: string;
}

export interface ListItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  actionLabel?: string;
  actionHref?: string;
  imageSrc?: string;
}