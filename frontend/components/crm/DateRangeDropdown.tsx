"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatRangeLabel, getPresetRange, type DateRange, type DateRangePresetKey } from "@/lib/utils/dateRangePresets";

interface DateRangeDropdownProps {
  range: DateRange | null;
  onChange: (range: DateRange | null) => void;
}

const PRESETS: { key: DateRangePresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "last30", label: "Last 30 Days" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "custom", label: "Custom Range" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = new Array(firstDay.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

function MonthGrid({
  year,
  month,
  tentativeStart,
  tentativeEnd,
  onPick,
}: {
  year: number;
  month: number;
  tentativeStart: Date | null;
  tentativeEnd: Date | null;
  onPick: (d: Date) => void;
}) {
  const cells = buildMonthGrid(year, month);

  return (
    <div className="w-64">
      <p className="mb-2 text-center text-sm font-medium text-neutral-700">{monthLabel(new Date(year, month, 1))}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 font-medium text-neutral-400">
            {w}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const isStart = tentativeStart && sameDay(date, tentativeStart);
          const isEnd = tentativeEnd && sameDay(date, tentativeEnd);
          const inRange =
            tentativeStart && tentativeEnd && date.getTime() > tentativeStart.getTime() && date.getTime() < tentativeEnd.getTime();
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(date)}
              className={`flex h-8 w-8 items-center justify-center justify-self-center rounded-full text-sm transition-colors ${
                isStart || isEnd
                  ? "bg-brand-500 font-semibold text-white"
                  : inRange
                    ? "bg-neutral-100 text-neutral-700"
                    : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangeDropdown({ range, onChange }: DateRangeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<DateRangePresetKey | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [tentativeStart, setTentativeStart] = useState<Date | null>(range?.start ?? null);
  const [tentativeEnd, setTentativeEnd] = useState<Date | null>(range?.end ?? null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePresetClick(key: DateRangePresetKey) {
    setActivePreset(key);
    if (key === "custom") return;
    const preset = getPresetRange(key);
    if (preset) {
      setTentativeStart(preset.start);
      setTentativeEnd(preset.end);
    }
  }

  function handleDayPick(date: Date) {
    setActivePreset("custom");
    if (!tentativeStart || (tentativeStart && tentativeEnd)) {
      setTentativeStart(date);
      setTentativeEnd(null);
    } else if (date.getTime() < tentativeStart.getTime()) {
      setTentativeStart(date);
    } else {
      setTentativeEnd(date);
    }
  }

  function handleApply() {
    if (tentativeStart && tentativeEnd) {
      onChange({ start: tentativeStart, end: tentativeEnd });
    }
    setIsOpen(false);
  }

  function handleCancel() {
    setTentativeStart(range?.start ?? null);
    setTentativeEnd(range?.end ?? null);
    setIsOpen(false);
  }

  const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <Calendar size={15} />
        {formatRangeLabel(range)}
      </button>

      {isOpen ? (
        <div className={`absolute left-0 z-30 mt-2 flex w-[min(680px,calc(100vw-2rem))] origin-top-left flex-col rounded-xl border border-neutral-200 bg-white shadow-lg transition-all duration-150 ease-out sm:flex-row ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}>
          <div className="flex shrink-0 flex-col gap-0.5 border-b border-neutral-100 p-2 sm:w-40 sm:border-b-0 sm:border-r">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handlePresetClick(preset.key)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                  activePreset === preset.key ? "bg-brand-500 text-white" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                aria-label="Previous month"
                className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                aria-label="Next month"
                className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <MonthGrid
                year={viewDate.getFullYear()}
                month={viewDate.getMonth()}
                tentativeStart={tentativeStart}
                tentativeEnd={tentativeEnd}
                onPick={handleDayPick}
              />
              <MonthGrid
                year={nextMonth.getFullYear()}
                month={nextMonth.getMonth()}
                tentativeStart={tentativeStart}
                tentativeEnd={tentativeEnd}
                onPick={handleDayPick}
              />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
              <p className="text-xs text-neutral-500">
                {tentativeStart ? tentativeStart.toLocaleDateString() : "Start"} —{" "}
                {tentativeEnd ? tentativeEnd.toLocaleDateString() : "End"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!tentativeStart || !tentativeEnd}
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}