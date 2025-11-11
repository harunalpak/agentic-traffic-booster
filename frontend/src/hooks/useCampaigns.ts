import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCampaigns } from "@/lib/api-client";
import type { Campaign, CampaignCreateRequest } from "@/types/campaign";

const keys = {
  all: ["campaigns"] as const,
  list: () => [...keys.all, "list"] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
};

export function useCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: keys.list(),
    queryFn: async () => (await apiCampaigns.get("/campaigns")).data,
  });
}

export function useCampaign(id: number) {
  return useQuery<Campaign>({
    queryKey: keys.detail(id),
    queryFn: async () => (await apiCampaigns.get(`/campaigns/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CampaignCreateRequest) =>
      (await apiCampaigns.post("/campaigns", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.list() });
    },
  });
}

export function usePauseCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await apiCampaigns.patch(`/campaigns/${id}/pause`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list() }),
  });
}

export function useResumeCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await apiCampaigns.patch(`/campaigns/${id}/resume`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list() }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await apiCampaigns.delete(`/campaigns/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list() }),
  });
}

