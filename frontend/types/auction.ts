export type AuctionStatus = "upcoming" | "live" | "ended";

export type AuctionViewerRole = "customer" | "admin" | "supervisor";

export type RoomAccess = "invite_only" | "open";

export interface AuctionListItem {
  id: string;
  lotTitle: string;
  category: string;
  imageSrc?: string;
  status: AuctionStatus;
  startsAt: string;
  endsAt: string;
  currentBid: string;
  reservePrice: string;
  visibleTo: AuctionViewerRole[];
  roomAccess: RoomAccess;
  bidderCount: number;
}