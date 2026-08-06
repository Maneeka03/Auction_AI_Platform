import { useCallback, useEffect, useRef, useState } from "react";
import { getAuction } from "@/lib/api/auctions";
import { listChat, postChat } from "@/lib/api/chat";
import { getWsBase } from "@/lib/utils/wsBase";
import type { Auction, AuctionSocketMessage } from "@/types/auction";
import type { ChatMessage } from "@/types/chat";

const RECONNECT_DELAY_MS = 2000;
const POLL_INTERVAL_MS = 4000;

export type ConnectionState = "connecting" | "live" | "reconnecting" | "polling";

interface UseBiddingRoomResult {
  auction: Auction | null;
  connectionState: ConnectionState;
  eventCount: number;
  chatMessages: ChatMessage[];
  sendChat: (body: string) => Promise<void>;
}

type WsMessage =
  | (AuctionSocketMessage & { message?: undefined })
  | { type: "chat"; message: ChatMessage; auction?: undefined };

export function useBiddingRoom(
  auctionId: string,
  accessToken: string | null,
): UseBiddingRoomResult {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [eventCount, setEventCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  // Load chat history on mount.
  useEffect(() => {
    if (!accessToken) return;
    void listChat(accessToken, auctionId).then(setChatMessages).catch(() => {});
  }, [accessToken, auctionId]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current || !accessToken) return;
    isPollingRef.current = true;
    setConnectionState("polling");
    async function poll() {
      try {
        const latest = await getAuction(accessToken as string, auctionId);
        setAuction(latest);
      } catch {}
    }
    void poll();
    pollTimerRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);
  }, [accessToken, auctionId]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      setConnectionState((prev) => (prev === "polling" ? prev : "connecting"));

      const socket = new WebSocket(
        `${getWsBase()}/api/v1/auctions/${auctionId}/ws?token=${encodeURIComponent(accessToken as string)}`,
      );
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        stopPolling();
        setConnectionState("live");
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg: WsMessage = JSON.parse(event.data);
          if (msg.type === "chat") {
            setChatMessages((prev) =>
              prev.some((m) => m.id === msg.message.id) ? prev : [...prev, msg.message],
            );
          } else if (msg.auction) {
            setAuction(msg.auction);
            setEventCount((n) => n + 1);
          }
        } catch {}
      };

      socket.onclose = (e) => {
        if (cancelled) return;
        if (e.code === 4401 || e.code === 4404) {
          startPolling();
          return;
        }
        setConnectionState("reconnecting");
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => socket.close();
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopPolling();
    };
  }, [auctionId, accessToken, startPolling, stopPolling]);

  const sendChat = useCallback(
    async (body: string) => {
      if (!accessToken) return;
      await postChat(accessToken, auctionId, body);
    },
    [accessToken, auctionId],
  );

  return { auction, connectionState, eventCount, chatMessages, sendChat };
}
