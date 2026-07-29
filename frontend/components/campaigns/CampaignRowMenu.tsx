"use client";

import { Eye, MoreVertical, Pencil, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CampaignRowMenuProps {
  onView: () => void;
  /** Omit to hide Edit (e.g. view-only permissions). */
  onEdit?: () => void;
  /** Omit to hide Send (e.g. already sent, or view-only permissions). */
  onSend?: () => void;
  /** Omit to hide Delete (e.g. view-only permissions). */
  onDelete?: () => void;
}

const MENU_WIDTH = 160;
const MENU_HEIGHT_ESTIMATE = 168;

export function CampaignRowMenu({ onView, onEdit, onSend, onDelete }: CampaignRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const opensUpward = rect.bottom + MENU_HEIGHT_ESTIMATE > window.innerHeight;
      setPosition({
        top: opensUpward ? rect.top - MENU_HEIGHT_ESTIMATE : rect.bottom + 4,
        left: rect.right - MENU_WIDTH,
      });
    }
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        aria-label="Row actions"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
      >
        <MoreVertical size={16} />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={{ position: "fixed", top: position.top, left: position.left, width: MENU_WIDTH }}
              className="z-50 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
            >
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onView();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Eye size={14} /> View
              </button>
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <Pencil size={14} /> Edit
                </button>
              ) : null}
              {onSend ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSend();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-brand-600 hover:bg-brand-500/5"
                >
                  <Send size={14} /> Send Now
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-500/5"
                >
                  <Trash2 size={14} /> Delete
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}