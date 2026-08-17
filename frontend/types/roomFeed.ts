import type { AuctionComment } from "@/types/comment";

export type SystemEventTone = "info" | "success" | "warning";

export interface SystemEvent {
  id: string;
  created_at: string;
  text: string;
  tone: SystemEventTone;
}

export type RoomFeedItem =
  | { kind: "comment"; id: string; created_at: string; comment: AuctionComment }
  | { kind: "system"; id: string; created_at: string; event: SystemEvent };