export type NotificationKind =
  | "outbid"
  | "auction_won"
  | "auction_lost"
  | "property_approved"
  | "property_rejected"
  | "kyc_reviewed";

export interface Notification {
  id: string;
  kind: NotificationKind;
  message: string;
  auction_id: string | null;
  property_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPage {
  items: Notification[];
  unread: number;
}

export interface MarkReadRequest {
  ids?: string[];
}