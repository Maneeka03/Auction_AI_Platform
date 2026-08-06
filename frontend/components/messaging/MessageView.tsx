"use client";

import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DmMessage, GroupMessage } from "@/types/messaging";

type AnyMessage = (DmMessage & { sender_name?: string }) | GroupMessage;

function isGroupMessage(m: AnyMessage): m is GroupMessage {
  return "group_id" in m;
}

interface Props {
  title: string;
  messages: AnyMessage[];
  currentUserId: string;
  readOnly?: boolean;
  onSend?: (body: string) => Promise<void>;
  loading?: boolean;
  onBack?: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MessageView({
  title,
  messages,
  currentUserId,
  readOnly,
  onSend,
  loading,
  onBack,
}: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !onSend || sending) return;
    setSending(true);
    try {
      await onSend(body.trim());
      setBody("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e as unknown as React.FormEvent);
    }
  }

  let lastDateLabel = "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 px-5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 md:hidden"
          >
            <ArrowLeft size={16} />
          </button>
        ) : null}
        <h2 className="text-sm font-semibold text-neutral-900 truncate">
          {title}
        </h2>
        {readOnly ? (
          <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
            read-only
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {loading ? (
          <p className="text-center text-sm text-neutral-400 py-10">
            Loading messages…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 py-10">
            No messages yet.
          </p>
        ) : (
          messages.map((msg) => {
            const senderId = msg.sender_id;
            const isMine = senderId === currentUserId;
            const senderName = isGroupMessage(msg)
              ? msg.sender_name
              : msg.sender_name;

            const dateLabel = formatDate(msg.created_at);
            const showDate = dateLabel !== lastDateLabel;
            lastDateLabel = dateLabel;

            return (
              <div key={msg.id}>
                {showDate ? (
                  <div className="my-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-neutral-200" />
                    <span className="text-xs text-neutral-400">
                      {dateLabel}
                    </span>
                    <div className="h-px flex-1 bg-neutral-200" />
                  </div>
                ) : null}
                <div
                  className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}
                >
                  <div
                    className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col`}
                  >
                    {!isMine && senderName ? (
                      <span className="mb-0.5 ml-1 text-xs font-medium text-neutral-500">
                        {senderName}
                      </span>
                    ) : null}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isMine
                          ? "rounded-br-sm bg-brand-500 text-white"
                          : "rounded-bl-sm bg-neutral-100 text-neutral-900"
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="mt-0.5 px-1 text-[11px] text-neutral-400">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {!readOnly && onSend ? (
        <form
          onSubmit={(e) => void handleSend(e)}
          className="flex shrink-0 items-end gap-2 border-t border-neutral-200 px-4 py-3"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      ) : null}
    </div>
  );
}
