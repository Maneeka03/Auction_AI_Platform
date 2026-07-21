import { useEffect, useState } from "react";

export interface Countdown {
  totalSeconds: number;
  isPast: boolean;
  label: string;
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function useCountdown(targetIso: string): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSeconds = (new Date(targetIso).getTime() - now) / 1000;
  return {
    totalSeconds,
    isPast: totalSeconds <= 0,
    label: formatDuration(totalSeconds),
  };
}