"use client";

import { useEffect, useRef, useState } from "react";

interface UseWheelZoomOptions {
  min?: number;
  max?: number;
  step?: number;
}

interface ZoomOrigin {
  x: number; // percentage, 0-100
  y: number; // percentage, 0-100
}

export function useWheelZoom({ min = 1, max = 2.2, step = 0.06 }: UseWheelZoomOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState<ZoomOrigin>({ x: 50, y: 50 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();

      const rect = node!.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setOrigin({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });

      setScale((prev) => {
        const direction = event.deltaY < 0 ? 1 : -1;
        const next = prev + direction * step;
        return Math.min(max, Math.max(min, next));
      });
    }

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [min, max, step]);

  return { containerRef, scale, origin };
}