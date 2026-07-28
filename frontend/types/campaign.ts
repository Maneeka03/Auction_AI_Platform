export type CampaignChannel = "email" | "sms" | "push";

export type CampaignStatus = "draft" | "scheduled" | "sent" | "archived";

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  subject: string | null;
  body: string;
  audience: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignPage {
  items: Campaign[];
  total: number;
  page: number;
  size: number;
}

export interface CreateCampaignRequest {
  name: string;
  channel: CampaignChannel;
  body: string;
  subject?: string | null;
  audience?: string | null;
  scheduled_at?: string | null;
}

export interface UpdateCampaignRequest {
  name?: string;
  channel?: CampaignChannel;
  status?: CampaignStatus;
  body?: string;
  subject?: string | null;
  audience?: string | null;
  scheduled_at?: string | null;
}
