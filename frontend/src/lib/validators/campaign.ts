import { z } from "zod";

export const channelEnum = z.enum(["TWITTER", "YOUTUBE", "PINTEREST"]);

export const campaignBasicsSchema = z.object({
  name: z.string().min(2, "Name is required"),
  dailyLimit: z.coerce.number().int().positive("Daily limit must be a positive integer"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  channel: channelEnum,
  productId: z.coerce.number().int(),
});

// Channel-specific config schemas (extensible):
export const twitterConfigSchema = z.object({
  minFollowerCount: z.coerce.number().int().min(0).default(0),
  hashtags: z.array(z.string()).default([]),
  recentWindowMinutes: z.coerce.number().int().min(1).max(1440).default(15),
});

export const youtubeConfigSchema = z.object({
  minSubscribers: z.coerce.number().int().min(0).default(0),
  keywords: z.array(z.string()).default([]),
});

export const pinterestConfigSchema = z.object({
  minFollowers: z.coerce.number().int().min(0).default(0),
  boards: z.array(z.string()).default([]),
});

