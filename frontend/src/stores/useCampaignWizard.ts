import { create } from "zustand";
import type { Channel } from "@/types/campaign";

interface WizardState {
  step: number;
  productId: number | null;
  channel: Channel | null;
  name: string;
  dailyLimit: number | null;
  startDate: string | null;
  endDate: string | null;
  config: Record<string, any>;
  reset: () => void;
  setStep: (s: number) => void;
  setProduct: (id: number) => void;
  setChannel: (c: Channel) => void;
  setBasics: (p: { name: string; dailyLimit: number; startDate?: string | null; endDate?: string | null; }) => void;
  setConfig: (cfg: Record<string, any>) => void;
}

export const useCampaignWizard = create<WizardState>((set) => ({
  step: 1,
  productId: null,
  channel: null,
  name: "",
  dailyLimit: null,
  startDate: null,
  endDate: null,
  config: {},
  reset: () => set({ step: 1, productId: null, channel: null, name: "", dailyLimit: null, startDate: null, endDate: null, config: {} }),
  setStep: (s) => set({ step: s }),
  setProduct: (id) => set({ productId: id }),
  setChannel: (c) => set({ channel: c }),
  setBasics: ({ name, dailyLimit, startDate = null, endDate = null }) => set({ name, dailyLimit, startDate, endDate }),
  setConfig: (cfg) => set({ config: cfg }),
}));

