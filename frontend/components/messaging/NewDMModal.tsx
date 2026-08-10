"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { chatSearch } from "@/lib/api/messages";
import { useAuth } from "@/lib/auth/session-context";
import type { ChatUser } from "@/types/messaging";

interface Props {
  onClose: () => void;
  onSelect: (user: ChatUser) => void;
}

export function NewDMModal({ onClose, onSelect }: Props) {
  const { accessToken } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!accessToken || q.trim().length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await chatSearch(accessToken, q.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, accessToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">New Direct Message</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email…"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="mt-3 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-neutral-400">Searching…</p>
            ) : results.length === 0 && q.length > 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">No users found.</p>
            ) : (
              results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelect(user)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-neutral-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:text-white">
                    {user.full_name
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("")}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{user.full_name}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
