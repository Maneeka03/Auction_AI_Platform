import type { Property } from "./property";

export type WatchlistStatus = "watching" | "cart" | "closed" | "delivered";

export interface WatchlistItem {
  status: WatchlistStatus;
  property: Property;
}
