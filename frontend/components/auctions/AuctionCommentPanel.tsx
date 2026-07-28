"use client";

import { MessagesSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AuctionComment } from "@/types/comment";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface AuctionCommentPanelProps {
  comments: AuctionComment[];
  currentUserId?: string;
  onSend: (body: string) => Promise<void>;
}

export function AuctionCommentPanel({ comments, currentUserId, onSend }: AuctionCommentPanelProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    setIsSending(true);
    try {
      await onSend(body);
      setText("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
        <MessagesSquare size={16} className="text-brand-500" />
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Live Chat</h2>
          <p className="text-xs text-neutral-500">{comments.length} messages</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {comments.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-400">
            No messages yet — say hello to the room.
          </p>
        ) : (
          comments.map((comment) => {
            const isMine = comment.user_id === currentUserId;
            return (
              <div key={comment.id} className="flex gap-2.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    isMine ? "bg-brand-500 text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {initials(comment.author_name)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-neutral-900">
                      {comment.author_name}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {formatTime(comment.created_at)}
                    </span>
                  </p>
                  <p className="break-words text-sm text-neutral-700">{comment.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-neutral-100 p-3">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Say something..."
          maxLength={1000}
          className="h-10 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={isSending || !text.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
