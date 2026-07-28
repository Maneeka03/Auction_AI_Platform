import { useCallback, useEffect, useRef, useState } from "react";
import { listComments, postComment } from "@/lib/api/comments";
import type { Auction } from "@/types/auction";
import type { AuctionComment, RoomMessage } from "@/types/comment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");
const RECONNECT_MS = 2000;

export type RoomConnection = "connecting" | "live" | "reconnecting";

interface UseAuctionRoomResult {
  auction: Auction | null;
  comments: AuctionComment[];
  connection: RoomConnection;
  send: (body: string) => Promise<void>;
}

// One WebSocket for the whole room: auction-state events keep `auction` fresh, comment events
// stream into `comments` live. Posting a comment goes over REST and echoes back through the socket.
export function useAuctionRoom(auctionId: string, accessToken: string | null): UseAuctionRoomResult {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [comments, setComments] = useState<AuctionComment[]>([]);
  const [connection, setConnection] = useState<RoomConnection>("connecting");

  const addComment = useCallback((incoming: AuctionComment) => {
    setComments((prev) => (prev.some((c) => c.id === incoming.id) ? prev : [...prev, incoming]));
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
        else setAuction(message.auction);
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
  }, [accessToken, auctionId, addComment]);

  const send = useCallback(
    async (body: string) => {
      if (!accessToken) return;
      await postComment(accessToken, auctionId, body);
    },
    [accessToken, auctionId],
  );

  return { auction, comments, connection, send };
}
