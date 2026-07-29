import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listComments, postComment } from "@/lib/api/comments";
import type { Auction } from "@/types/auction";
import type { AuctionComment, RoomMessage } from "@/types/comment";
import type { RoomFeedItem, SystemEvent } from "@/types/roomFeed";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");
const RECONNECT_MS = 2000;

export type RoomConnection = "connecting" | "live" | "reconnecting";

interface UseAuctionRoomResult {
  auction: Auction | null;
  comments: AuctionComment[];
  feed: RoomFeedItem[];
  connection: RoomConnection;
  send: (body: string) => Promise<void>;
}

let systemEventCounter = 0;
function nextSystemId(): string {
  systemEventCounter += 1;
  return `sys-${Date.now()}-${systemEventCounter}`;
}

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

function diffAuctionEvents(prev: Auction | null, next: Auction): SystemEvent[] {
  const events: SystemEvent[] = [];
  const now = new Date().toISOString();

  if (!prev) return events;

  if (prev.status !== "live" && next.status === "live") {
    events.push({ id: nextSystemId(), created_at: now, text: "Auction is now live — bidding is open.", tone: "success" });
  }

  if (next.current_bid && prev.current_bid !== next.current_bid) {
    events.push({
      id: nextSystemId(),
      created_at: now,
      text: `New highest bid: ${formatMoney(next.current_bid)}`,
      tone: "info",
    });

    const reserve = Number(next.reserve_price);
    const prevBid = prev.current_bid ? Number(prev.current_bid) : 0;
    const nextBid = Number(next.current_bid);
    if (reserve > 0 && prevBid < reserve && nextBid >= reserve) {
      events.push({ id: nextSystemId(), created_at: now, text: "Reserve price reached 🎉", tone: "success" });
    }
  }

  if (next.bidder_count > prev.bidder_count) {
    events.push({ id: nextSystemId(), created_at: now, text: "A new bidder joined the room.", tone: "info" });
  }

  if (prev.status !== "ended" && next.status === "ended") {
    events.push({
      id: nextSystemId(),
      created_at: now,
      text: next.winner_id ? "Auction has ended — a winner was selected." : "Auction has ended with no sale.",
      tone: "warning",
    });
  }

  return events;
}

export function useAuctionRoom(auctionId: string, accessToken: string | null): UseAuctionRoomResult {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [comments, setComments] = useState<AuctionComment[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [connection, setConnection] = useState<RoomConnection>("connecting");
  const prevAuctionRef = useRef<Auction | null>(null);

  const addComment = useCallback((incoming: AuctionComment) => {
    setComments((prev) => (prev.some((c) => c.id === incoming.id) ? prev : [...prev, incoming]));
  }, []);

  const applyAuction = useCallback((next: Auction) => {
    const newEvents = diffAuctionEvents(prevAuctionRef.current, next);
    if (newEvents.length > 0) {
      setSystemEvents((prev) => [...prev, ...newEvents]);
    }
    prevAuctionRef.current = next;
    setAuction(next);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    void listComments(accessToken, auctionId).then(setComments).catch(() => {});
  }, [accessToken, auctionId]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    function connect() {
      if (cancelled) return;
      socket = new WebSocket(
        `${WS_BASE_URL}/api/v1/auctions/${auctionId}/ws?token=${encodeURIComponent(accessToken as string)}`,
      );
      socket.onopen = () => !cancelled && setConnection("live");
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as RoomMessage;
        if (message.type === "comment") addComment(message.comment);
        else applyAuction(message.auction);
      };
      socket.onclose = () => {
        if (cancelled) return;
        setConnection("reconnecting");
        retry = setTimeout(connect, RECONNECT_MS);
      };
    }
    connect();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [accessToken, auctionId, addComment, applyAuction]);

  const send = useCallback(
    async (body: string) => {
      if (!accessToken) return;
      await postComment(accessToken, auctionId, body);
    },
    [accessToken, auctionId],
  );

  const feed = useMemo<RoomFeedItem[]>(() => {
    const commentItems: RoomFeedItem[] = comments.map((comment) => ({
      kind: "comment",
      id: comment.id,
      created_at: comment.created_at,
      comment,
    }));
    const systemItems: RoomFeedItem[] = systemEvents.map((event) => ({
      kind: "system",
      id: event.id,
      created_at: event.created_at,
      event,
    }));
    return [...commentItems, ...systemItems].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [comments, systemEvents]);

  return { auction, comments, feed, connection, send };
}