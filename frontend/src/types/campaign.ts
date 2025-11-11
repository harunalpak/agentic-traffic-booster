export type Channel = "TWITTER" | "YOUTUBE" | "PINTEREST";
export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";

export interface Campaign {
  id: number;
  productId: number;
  name: string;
  channel: Channel;
  dailyLimit: number; // integer
  startDate?: string | null; // ISO date (yyyy-mm-dd)
  endDate?: string | null;   // ISO date or null
  status: CampaignStatus;
  config?: Record<string, any> | null; // channel-specific
  createdAt?: string;
}

export interface CampaignCreateRequest {
  productId: number;
  name: string;
  channel: Channel;
  dailyLimit: number;
  startDate?: string | null;
  endDate?: string | null;
  config?: Record<string, any> | null;
}

export interface ChannelType {
  name: string;
  displayName: string;
  description: string;
  configFields: string[];
}

