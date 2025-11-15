import { useQuery } from "@tanstack/react-query";
import { apiSocialEngine } from "@/lib/api-client";

export interface CampaignStats {
  campaignId: number;
  period: string;
  totalFound: number;
  posted: number;
  rejected: number;
  pending: number;
  approved: number;
}

export function useCampaignStats(campaignId: number) {
  return useQuery<CampaignStats>({
    queryKey: ["campaign-stats", campaignId],
    queryFn: async () => {
      const response = await apiSocialEngine.get(`/tasks/stats/campaign/${campaignId}`);
      return response.data;
    },
    enabled: !!campaignId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook to get stats for multiple campaigns at once
export function useMultipleCampaignStats(campaignIds: number[]) {
  return useQuery<Record<number, CampaignStats>>({
    queryKey: ["multiple-campaign-stats", campaignIds],
    queryFn: async () => {
      const statsPromises = campaignIds.map(async (id) => {
        try {
          const response = await apiSocialEngine.get(`/tasks/stats/campaign/${id}`);
          return { id, stats: response.data };
        } catch (error) {
          console.error(`Failed to fetch stats for campaign ${id}:`, error);
          return {
            id,
            stats: {
              campaignId: id,
              period: "24h",
              totalFound: 0,
              posted: 0,
              rejected: 0,
              pending: 0,
              approved: 0,
            },
          };
        }
      });

      const results = await Promise.all(statsPromises);
      return results.reduce((acc, { id, stats }) => {
        acc[id] = stats;
        return acc;
      }, {} as Record<number, CampaignStats>);
    },
    enabled: campaignIds.length > 0,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

