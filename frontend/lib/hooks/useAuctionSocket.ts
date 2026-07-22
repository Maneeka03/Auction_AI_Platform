import { useCallback, useEffect, useRef, useState } from "react";
import { getAuction } from "@/lib/api/auctions";
import type { Auction, AuctionSocketMessage } from "@/types/auction";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

const RECONNECT_DELAY_MS = 2000;
const POLL_INTERVAL_MS = 4000;

export type ConnectionState = "connecting" | "live" | "reconnecting" | "polling";

interface UseAuctionSocketResult {
  auction: Auction | null;
  connectionState: ConnectionState;
  lastEvent: AuctionSocketMessage["type"] | null;
}

export function useAuctionSocket(auctionId: string, accessToken: string | null): UseAuctionSocketResult {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [lastEvent, setLastEvent] = useState<AuctionSocketMessage["type"] | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  const startPolling = useCallback(() => {
    if (isPollingRef.current || !accessToken) return;
    isPollingRef.current = true;
    setConnectionState("polling");

    async function poll() {
      try {
        const latest = await getAuction(accessToken as string, auctionId);
        setAuction(latest);
      } catch {
      }
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
        `${WS_BASE_URL}/api/v1/auctions/${auctionId}/ws?token=${encodeURIComponent(accessToken as string)}`,
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
          const message: AuctionSocketMessage = JSON.parse(event.data);
          setAuction(message.auction);
          setLastEvent(message.type);
        } catch {}
      };

      socket.onclose = (event) => {
        if (cancelled) return;
        if (event.code === 4401 || event.code === 4404) {
          startPolling();
          return;
        }
        setConnectionState("reconnecting");
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopPolling();
    };
  }, [auctionId, accessToken, startPolling, stopPolling]);

  return { auction, connectionState, lastEvent };
}