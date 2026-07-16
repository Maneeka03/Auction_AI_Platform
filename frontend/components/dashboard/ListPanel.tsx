import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ListItem } from "@/types/dashboard";

interface ListPanelProps {
  title: string;
  items: ListItem[];
  viewAllHref: string;
  icon: LucideIcon;
}

const chipPalette = [
  "bg-brand-500/10 text-brand-600",
  "bg-success-500/10 text-success-500",
  "bg-amber-500/10 text-amber-600",
  "bg-sky-500/10 text-sky-600",
];

function ItemThumbnail({ imageSrc, color, icon: Icon }: { imageSrc?: string; color: string; icon: LucideIcon }) {
  if (imageSrc) {
    return (
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-100">
        <Image src={imageSrc} alt="" fill sizes="36px" className="object-cover" />
      </span>
    );
  }

  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}>
      <Icon size={16} />
    </span>
  );
}

export function ListPanel({ title, items, viewAllHref, icon: Icon }: ListPanelProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        <Link href={viewAllHref} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">
          View All
        </Link>
      </div>

      <ul className="mt-3 divide-y divide-neutral-100">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <ItemThumbnail
              imageSrc={item.imageSrc}
              color={chipPalette[index % chipPalette.length]}
              icon={Icon}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
              <p className="text-xs text-neutral-500">{item.subtitle}</p>
            </div>

            <div className="shrink-0 text-right">
              {item.actionHref ? (
                <Link href={item.actionHref} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  {item.actionLabel}
                </Link>
              ) : (
                <span className="text-sm font-medium text-neutral-900">{item.meta}</span>
              )}
              {item.actionHref ? <p className="mt-0.5 text-xs text-neutral-400">{item.meta}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}