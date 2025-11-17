"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCampaign, useUpdateCampaign } from "@/hooks/useCampaigns";
import { useProductsLite } from "@/hooks/useProductsLite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ProductSelector } from "@/components/campaigns/ProductSelector";
import { ChannelSelector } from "@/components/campaigns/ChannelSelector";
import { CampaignBasicsForm } from "@/components/campaigns/CampaignBasicsForm";
import { ChannelConfigForm } from "@/components/campaigns/ChannelConfigForm";
import type { Channel } from "@/types/campaign";

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = Number(params.id);
  const { data: campaign, isLoading: isLoadingCampaign } = useCampaign(campaignId);
  const { data: products } = useProductsLite();
  const updateMutation = useUpdateCampaign();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState<number | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [basics, setBasics] = useState<{
    name: string;
    dailyLimit: number;
    startDate?: string | null;
    endDate?: string | null;
  } | null>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);

  // Initialize form data when campaign loads
  useEffect(() => {
    if (campaign) {
      setProductId(campaign.productId);
      setChannel(campaign.channel);
      setBasics({
        name: campaign.name,
        dailyLimit: campaign.dailyLimit,
        startDate: campaign.startDate || null,
        endDate: campaign.endDate || null,
      });
      setConfig(campaign.config || null);
    }
  }, [campaign]);

  const handleProductSelect = (id: number) => {
    setProductId(id);
    setStep(2);
  };

  const handleChannelSelect = (ch: Channel) => {
    setChannel(ch);
    setStep(3);
  };

  const handleBasicsSubmit = (data: {
    name: string;
    dailyLimit: number;
    startDate?: string | null;
    endDate?: string | null;
  }) => {
    setBasics(data);
    setStep(4);
  };

  const handleConfigSubmit = (cfg: Record<string, any>) => {
    setConfig(cfg);
    setStep(5);
  };

  const handleUpdateCampaign = async () => {
    if (!productId || !channel || !basics) {
      toast({
        title: "Missing Information",
        description: "Please complete all required steps.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: campaignId,
        payload: {
          productId,
          name: basics.name,
          channel,
          dailyLimit: basics.dailyLimit,
          startDate: basics.startDate || null,
          endDate: basics.endDate || null,
          config: config || null,
        },
      });

      toast({
        title: "Campaign Updated",
        description: "Your campaign has been updated successfully.",
      });

      router.push("/campaigns");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getProductName = () => {
    if (!productId || !products) return "";
    const product = products.find((p) => p.id === productId);
    return product?.title || `Product #${productId}`;
  };

  if (isLoadingCampaign) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
            <CardDescription>The campaign you&apos;re looking for doesn&apos;t exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/campaigns")} className="w-full">
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if campaign can be edited (only COMPLETED campaigns cannot be edited)
  if (campaign.status === "COMPLETED") {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Cannot Edit Campaign</CardTitle>
            <CardDescription>
              COMPLETED campaigns cannot be edited. This campaign is {campaign.status}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/campaigns")} className="w-full">
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Select Product" },
    { number: 2, title: "Choose Channel" },
    { number: 3, title: "Basic Info" },
    { number: 4, title: "Configure" },
    { number: 5, title: "Review" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              router.push("/campaigns");
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Campaign</h1>
          <p className="text-muted-foreground">
            Update your campaign settings
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, idx) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${step >= s.number
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
                }
              `}
            >
              {s.number}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`
                  w-16 h-1 mx-2
                  ${step > s.number ? "bg-primary" : "bg-muted"}
                `}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step - 1]?.title}</CardTitle>
          <CardDescription>
            {step === 1 && "Select the product you want to promote"}
            {step === 2 && "Choose the platform for your campaign"}
            {step === 3 && "Provide campaign details"}
            {step === 4 && "Configure channel-specific settings"}
            {step === 5 && "Review and update your campaign"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <ProductSelector
              onSelect={handleProductSelect}
              selectedId={productId}
            />
          )}

          {step === 2 && (
            <ChannelSelector
              onSelect={handleChannelSelect}
              selectedChannel={channel}
            />
          )}

          {step === 3 && productId && channel && (
            <CampaignBasicsForm
              onNext={handleBasicsSubmit}
              initialData={{
                name: basics?.name || "",
                dailyLimit: basics?.dailyLimit || undefined,
                startDate: basics?.startDate || null,
                endDate: basics?.endDate || null,
                productId,
                channel,
              }}
            />
          )}

          {step === 4 && channel && (
            <ChannelConfigForm
              channel={channel}
              onNext={handleConfigSubmit}
              initialData={config || undefined}
            />
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product</p>
                    <p className="text-lg">{getProductName()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Channel</p>
                    <Badge className="mt-1">{channel}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Campaign Name</p>
                    <p className="text-lg">{basics?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily Limit</p>
                    <p className="text-lg">{basics?.dailyLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-lg">{basics?.startDate || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-lg">{basics?.endDate || "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Channel Configuration
                  </p>
                  <pre className="bg-muted p-4 rounded-lg text-sm">
                    {JSON.stringify(config, null, 2)}
                  </pre>
                </div>
              </div>

              <Button
                onClick={handleUpdateCampaign}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

