"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { chatSearch, createGroup } from "@/lib/api/messages";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { ChatUser, GroupChat } from "@/types/messaging";

interface Props {
  onClose: () => void;
  onCreate: (group: GroupChat) => void;
}

export function CreateGroupModal({ onClose, onCreate }: Props) {
  const { accessToken } = useAuth();
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ChatUser[]>([]);
  const [selected, setSelected] = useState<ChatUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setSearching(true);
      try {
        const data = await chatSearch(accessToken, q.trim());
        setResults(data.filter((u) => !selected.some((s) => s.id === u.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, accessToken, selected]);

  function addMember(user: ChatUser) {
    setSelected((prev) => [...prev, user]);
    setQ("");
    setResults([]);
  }

  function removeMember(id: string) {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !name.trim() || selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const group = await createGroup(
        accessToken,
        name.trim(),
        selected.map((u) => u.id),
      );
      onCreate(group);
      toast.success("Group created successfully");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create group.");
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to create group.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Create Group Chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Group name</label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Auction Team"
              required
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Add members</label>
            {selected.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selected.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {u.full_name}
                    <button type="button" onClick={() => removeMember(u.id)} className="ml-1">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users…"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {results.length > 0 || searching ? (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
                {searching ? (
                  <p className="px-3 py-2 text-sm text-neutral-400">Searching…</p>
                ) : (
                  results.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addMember(user)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    >
                      <span className="font-medium text-neutral-900">{user.full_name}</span>
                      <span className="text-neutral-400">{user.email}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || selected.length === 0}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
