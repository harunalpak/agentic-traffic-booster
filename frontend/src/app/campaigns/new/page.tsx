"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCampaignWizard } from "@/stores/useCampaignWizard";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { useProductsLite } from "@/hooks/useProductsLite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { WizardStepper } from "@/components/campaigns/WizardStepper";
import { ProductSelector } from "@/components/campaigns/ProductSelector";
import { ChannelSelector } from "@/components/campaigns/ChannelSelector";
import { CampaignBasicsForm } from "@/components/campaigns/CampaignBasicsForm";
import { ChannelConfigForm } from "@/components/campaigns/ChannelConfigForm";

const steps = [
  { number: 1, title: "Select Product" },
  { number: 2, title: "Choose Channel" },
  { number: 3, title: "Basic Info" },
  { number: 4, title: "Configure" },
  { number: 5, title: "Review" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const wizard = useCampaignWizard();
  const createMutation = useCreateCampaign();
  const { data: products } = useProductsLite();
  const { toast } = useToast();

  useEffect(() => {
    // Reset wizard on mount
    return () => {
      wizard.reset();
    };
  }, []);

  const handleProductSelect = (productId: number) => {
    wizard.setProduct(productId);
    wizard.setStep(2);
  };

  const handleChannelSelect = (channel: any) => {
    wizard.setChannel(channel);
    wizard.setStep(3);
  };

  const handleBasicsSubmit = (data: any) => {
    wizard.setBasics(data);
    wizard.setStep(4);
  };

  const handleConfigSubmit = (config: any) => {
    wizard.setConfig(config);
    wizard.setStep(5);
  };

  const handleCreateCampaign = async () => {
    if (!wizard.productId || !wizard.channel || !wizard.name || !wizard.dailyLimit) {
      toast({
        title: "Missing Information",
        description: "Please complete all required steps.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        productId: wizard.productId,
        name: wizard.name,
        channel: wizard.channel,
        dailyLimit: wizard.dailyLimit,
        startDate: wizard.startDate,
        endDate: wizard.endDate,
        config: wizard.config,
      });

      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully.",
      });

      wizard.reset();
      router.push("/campaigns");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getProductName = () => {
    if (!wizard.productId || !products) return "";
    const product = products.find((p) => p.id === wizard.productId);
    return product?.title || `Product #${wizard.productId}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (wizard.step > 1) {
              wizard.setStep(wizard.step - 1);
            } else {
              router.push("/campaigns");
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Follow the steps to create your automated traffic campaign
          </p>
        </div>
      </div>

      <WizardStepper steps={steps} currentStep={wizard.step} />

      <Card>
        <CardHeader>
          <CardTitle>{steps[wizard.step - 1]?.title}</CardTitle>
          <CardDescription>
            {wizard.step === 1 && "Select the product you want to promote"}
            {wizard.step === 2 && "Choose the platform for your campaign"}
            {wizard.step === 3 && "Provide campaign details"}
            {wizard.step === 4 && "Configure channel-specific settings"}
            {wizard.step === 5 && "Review and create your campaign"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wizard.step === 1 && (
            <ProductSelector
              onSelect={handleProductSelect}
              selectedId={wizard.productId}
            />
          )}

          {wizard.step === 2 && (
            <ChannelSelector
              onSelect={handleChannelSelect}
              selectedChannel={wizard.channel}
            />
          )}

          {wizard.step === 3 && wizard.productId && wizard.channel && (
            <CampaignBasicsForm
              onNext={handleBasicsSubmit}
              initialData={{
                name: wizard.name,
                dailyLimit: wizard.dailyLimit,
                startDate: wizard.startDate,
                endDate: wizard.endDate,
                productId: wizard.productId,
                channel: wizard.channel,
              }}
            />
          )}

          {wizard.step === 4 && wizard.channel && (
            <ChannelConfigForm
              channel={wizard.channel}
              onNext={handleConfigSubmit}
              initialData={wizard.config}
            />
          )}

          {wizard.step === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product</p>
                    <p className="text-lg">{getProductName()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Channel</p>
                    <Badge className="mt-1">{wizard.channel}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Campaign Name</p>
                    <p className="text-lg">{wizard.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily Limit</p>
                    <p className="text-lg">{wizard.dailyLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-lg">{wizard.startDate || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-lg">{wizard.endDate || "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Channel Configuration
                  </p>
                  <pre className="bg-muted p-4 rounded-lg text-sm">
                    {JSON.stringify(wizard.config, null, 2)}
                  </pre>
                </div>
              </div>

              <Button
                onClick={handleCreateCampaign}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

