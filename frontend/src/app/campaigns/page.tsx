"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { useCampaigns, usePauseCampaign, useResumeCampaign, useDeleteCampaign } from "@/hooks/useCampaigns";
import { useProductsLite } from "@/hooks/useProductsLite";
import { useMultipleCampaignStats } from "@/hooks/useCampaignStats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import type { Campaign, CampaignStatus, Channel } from "@/types/campaign";

const statusColors: Record<CampaignStatus, string> = {
  DRAFT: "bg-gray-500",
  ACTIVE: "bg-green-500",
  PAUSED: "bg-yellow-500",
  COMPLETED: "bg-blue-500",
};

const channelColors: Record<Channel, string> = {
  TWITTER: "bg-blue-400",
  YOUTUBE: "bg-red-500",
  PINTEREST: "bg-red-600",
};

export default function CampaignsPage() {
  const { data: campaigns, isLoading, error } = useCampaigns();
  const { data: products } = useProductsLite();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const deleteMutation = useDeleteCampaign();
  const { toast } = useToast();

  // Sort campaigns by ID to maintain consistent order
  const sortedCampaigns = campaigns ? [...campaigns].sort((a, b) => b.id - a.id) : [];
  
  // Get campaign IDs for stats
  const campaignIds = sortedCampaigns.map(c => c.id);
  const { data: campaignStats } = useMultipleCampaignStats(campaignIds);

  const getProductName = (productId: number) => {
    const product = products?.find((p) => p.id === productId);
    return product?.title || `Product #${productId}`;
  };

  const getProduct = (productId: number) => {
    return products?.find((p) => p.id === productId);
  };

  const handlePause = async (id: number) => {
    try {
      await pauseMutation.mutateAsync(id);
      toast({
        title: "Campaign paused",
        description: "The campaign has been paused successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause campaign. Only ACTIVE campaigns can be paused.",
        variant: "destructive",
      });
    }
  };

  const handleResume = async (id: number) => {
    try {
      await resumeMutation.mutateAsync(id);
      toast({
        title: "Campaign resumed",
        description: "The campaign is now active.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume campaign. COMPLETED campaigns cannot be resumed.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Campaign deleted",
        description: "The campaign has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Error Loading Campaigns</CardTitle>
            <CardDescription>Please check if the campaign service is running.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!sortedCampaigns || sortedCampaigns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>No Campaigns Yet</CardTitle>
            <CardDescription>Get started by creating your first campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/campaigns/new">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Campaigns
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your automated traffic campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="gradient-primary hover:opacity-90 transition-smooth shadow-modern">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <Card className="shadow-modern-lg border-0 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Stats (24h)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.map((campaign: Campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const product = getProduct(campaign.productId);
                        return (
                          <>
                            {product?.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-muted-foreground">No img</span>
                              </div>
                            )}
                            <span className="font-medium">{getProductName(campaign.productId)}</span>
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={channelColors[campaign.channel]}>
                      {campaign.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaignStats && campaignStats[campaign.id] ? (
                      <div className="flex flex-col gap-0.5 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Found:</span>
                          <span className="font-medium">{campaignStats[campaign.id].totalFound}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Posted:</span>
                          <span className="font-medium text-green-600">{campaignStats[campaign.id].posted}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Rejected:</span>
                          <span className="font-medium text-red-600">{campaignStats[campaign.id].rejected}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Loading...</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[campaign.status]}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.startDate
                      ? new Date(campaign.startDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {campaign.endDate
                      ? new Date(campaign.endDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {campaign.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePause(campaign.id)}
                          disabled={pauseMutation.isPending}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {(campaign.status === "DRAFT" || campaign.status === "PAUSED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResume(campaign.id)}
                          disabled={resumeMutation.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

