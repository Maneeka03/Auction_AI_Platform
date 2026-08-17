"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export function useDropdownPosition(isOpen: boolean, anchorRef: RefObject<HTMLElement | null>) {
  const [dropUp, setDropUp] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setDropUp(false);
      return;
    }
    if (!anchorRef.current || !panelRef.current) return;

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;

    const notEnoughRoomBelow = spaceBelow < panelHeight + 16;
    const moreRoomAbove = spaceAbove > spaceBelow;

    setDropUp(notEnoughRoomBelow && moreRoomAbove);
  }, [isOpen, anchorRef]);

  return { panelRef, dropUp };
}