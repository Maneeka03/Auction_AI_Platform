export type CampaignStatus =
  | "Draft"
  | "Scheduled"
  | "Running"
  | "Paused"
  | "Completed";

export interface Campaign {
  id: string;
  name: string;
  type: "Email" | "SMS" | "Push";
  audience: string;
  status: CampaignStatus;
  subject: string;
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  openRate: number;
  createdAt: string;
  scheduledAt?: string;
}

export const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Luxury Auction Promotion",
    type: "Email",
    audience: "Buyers",
    status: "Running",
    subject: "Luxury Properties This Weekend",
    recipients: 2500,
    delivered: 2450,
    opened: 1800,
    clicked: 650,
    openRate: 73,
    createdAt: "2026-07-25",
  },
  {
    id: "2",
    name: "Seller Welcome Campaign",
    type: "Email",
    audience: "Sellers",
    status: "Scheduled",
    subject: "Welcome to Auction AI",
    recipients: 1200,
    delivered: 0,
    opened: 0,
    clicked: 0,
    openRate: 0,
    createdAt: "2026-07-26",
    scheduledAt: "2026-07-30",
  },
  {
    id: "3",
    name: "Investment Opportunities",
    type: "SMS",
    audience: "Investors",
    status: "Completed",
    subject: "New Commercial Listings",
    recipients: 850,
    delivered: 840,
    opened: 720,
    clicked: 210,
    openRate: 86,
    createdAt: "2026-07-20",
  },
];