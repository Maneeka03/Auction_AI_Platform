"use client";

import { MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/chat";

interface Props {
  messages: ChatMessage[];
  currentUserId: string | undefined;
  canSend: boolean;
  onSend: (body: string) => Promise<void>;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function BiddingChatPanel({ messages, currentUserId, canSend, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setError(null);
    setSending(true);
    try {
      await onSend(body);
      setDraft("");
    } catch {
      setError("Failed to send message. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-neutral-100 px-4 py-3">
        <MessageCircle size={15} className="text-brand-500" />
        <span className="text-sm font-semibold text-neutral-800">Live Chat</span>
        <span className="ml-auto flex h-2 w-2 animate-pulse rounded-full bg-green-400" />
      </div>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 sm:px-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-xs text-neutral-400">
              No messages yet.
              <br />
              Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((msg) => {
              const isMe = msg.user_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="mb-0.5 flex items-baseline gap-1.5">
                    {!isMe && (
                      <span className="max-w-[120px] truncate text-xs font-semibold text-neutral-700 sm:max-w-none">
                        {msg.author_name}
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-400">{formatTime(msg.created_at)}</span>
                  </div>
                  <div
                    className={`max-w-[85%] break-words rounded-2xl px-3 py-2 text-sm leading-snug sm:max-w-[80%] ${
                      isMe
                        ? "rounded-tr-sm bg-brand-500 text-white"
                        : "rounded-tl-sm bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="shrink-0 px-4 pb-1 text-xs text-red-500">{error}</p>
      )}

      {/* Input */}
      {canSend ? (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex shrink-0 items-center gap-2 border-t border-neutral-100 p-2 sm:p-3"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            disabled={sending}
            className="h-9 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </form>
      ) : (
        <div className="shrink-0 border-t border-neutral-100 px-4 py-3 text-center text-xs text-neutral-400">
          View only — you cannot send messages here.
        </div>
      )}
    </div>
  );
}
