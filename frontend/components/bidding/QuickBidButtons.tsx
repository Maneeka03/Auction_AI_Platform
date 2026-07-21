interface QuickBidButtonsProps {
  currentBid: string | null;
  openingBid: string;
  increments: string[];
  disabled?: boolean;
  onBid: (amount: string) => void;
}

export function QuickBidButtons({ currentBid, openingBid, increments, disabled, onBid }: QuickBidButtonsProps) {
  const base = Number(currentBid ?? openingBid);

  return (
    <div className="grid grid-cols-3 gap-2">
      {increments.map((increment) => {
        const amount = base + Number(increment);
        return (
          <button
            key={increment}
            type="button"
            disabled={disabled}
            onClick={() => onBid(amount.toFixed(2))}
            className="rounded-lg border border-brand-200 bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ${amount.toLocaleString()}
          </button>
        );
      })}
    </div>
  );
}