type Value = string | number | boolean | null;

interface Props {
  attributes: Record<string, Value>;
  className?: string;
}

function humanize(key: string): string {
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Renders a listing's category attributes as a spec list. Keys are field slugs, humanized for
// display; empty, null, and false values are hidden.
export function CategoryAttributes({ attributes, className = "" }: Props) {
  const entries = Object.entries(attributes).filter(
    ([, v]) => v !== null && v !== "" && v !== false,
  );
  if (entries.length === 0) return null;

  return (
    <dl className={`grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2 ${className}`}>
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
          <dt className="text-neutral-500">{humanize(key)}</dt>
          <dd className="text-right font-medium text-neutral-900">
            {value === true ? "Yes" : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
