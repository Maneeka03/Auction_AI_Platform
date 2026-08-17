import type { Auction } from "@/types/auction";
import type { ChatMessage } from "@/types/chat";

export interface AuctionComment {
  id: string;
  auction_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

// Everything the auction-room WebSocket can send.
export type RoomMessage =
  | { type: "snapshot" | "bid" | "updated" | "ended"; auction: Auction }
  | { type: "comment"; comment: AuctionComment }
  | { type: "chat"; message: ChatMessage };
