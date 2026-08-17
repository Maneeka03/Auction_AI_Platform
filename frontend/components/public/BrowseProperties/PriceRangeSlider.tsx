"use client";

interface Props {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}

export default function PriceRangeSlider({ min, max, valueMin, valueMax, onChange }: Props) {
  const pctMin = max > min ? ((valueMin - min) / (max - min)) * 100 : 0;
  const pctMax = max > min ? ((valueMax - min) / (max - min)) * 100 : 100;

  return (
    <div className="dual-range relative h-6">
      <style>{`
        .dual-range input[type="range"] {
          position: absolute;
          width: 100%;
          top: 0;
          left: 0;
          margin: 0;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          pointer-events: none;
        }
        .dual-range input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #6f5be0;
          cursor: pointer;
          margin-top: 3px;
        }
        .dual-range input[type="range"]::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #6f5be0;
          cursor: pointer;
        }
        .dual-range input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }
      `}</style>

      <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-200" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-500"
        style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
      />

      <input
        type="range"
        min={min}
        max={max}
        value={valueMin}
        onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax - 1), valueMax)}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={valueMax}
        onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin + 1))}
      />
    </div>
  );
}