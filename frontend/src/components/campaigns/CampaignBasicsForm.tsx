"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { campaignBasicsSchema } from "@/lib/validators/campaign";
import type { z } from "zod";

type FormData = z.infer<typeof campaignBasicsSchema>;

interface CampaignBasicsFormProps {
  onNext: (data: { name: string; dailyLimit: number; startDate?: string | null; endDate?: string | null }) => void;
  initialData?: {
    name?: string;
    dailyLimit?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    productId: number;
    channel: string;
  };
}

export function CampaignBasicsForm({ onNext, initialData }: CampaignBasicsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(campaignBasicsSchema),
    defaultValues: {
      name: initialData?.name || "",
      dailyLimit: initialData?.dailyLimit || undefined,
      startDate: initialData?.startDate || undefined,
      endDate: initialData?.endDate || undefined,
      productId: initialData?.productId,
      channel: initialData?.channel as any,
    },
  });

  const onSubmit = (data: FormData) => {
    onNext({
      name: data.name,
      dailyLimit: data.dailyLimit,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Summer Sale Twitter Campaign"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyLimit">Daily Action Limit *</Label>
        <Input
          id="dailyLimit"
          type="number"
          placeholder="e.g., 100"
          {...register("dailyLimit")}
        />
        {errors.dailyLimit && (
          <p className="text-sm text-destructive">{errors.dailyLimit.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            {...register("startDate")}
          />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input
            id="endDate"
            type="date"
            {...register("endDate")}
          />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}

