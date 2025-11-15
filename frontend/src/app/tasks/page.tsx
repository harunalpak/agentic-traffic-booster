"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Copy, Check, X, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatRelativeTime, formatFullDate } from "@/lib/date-utils";

interface Task {
  id: number;
  tweetId: string;
  campaignId: number;
  replyText: string;
  mode: string;
  status: string;
  tweetAuthor: string;
  tweetText: string;
  tweetUrl: string | null;
  confidenceScore: number;
  shortLink: string;
  isRisky: boolean;
  riskReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  id: number;
  name: string;
}

interface Product {
  id: number;
  title: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
    fetchCampaigns();
    fetchProducts();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch("http://localhost:8083/api/tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("http://localhost:8082/api/campaigns");
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const markPosted = async (taskId: number) => {
    try {
      await fetch(`http://localhost:8083/api/tasks/${taskId}/mark-posted`, {
        method: "PUT",
      });
      
      toast({
        title: "Success",
        description: "Task marked as posted",
      });
      
      fetchTasks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark task as posted",
        variant: "destructive",
      });
    }
  };

  const discardTask = async (taskId: number) => {
    try {
      await fetch(`http://localhost:8083/api/tasks/${taskId}/reject`, {
        method: "PUT",
      });
      
      toast({
        title: "Success",
        description: "Task discarded",
      });
      
      fetchTasks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to discard task",
        variant: "destructive",
      });
    }
  };

  const copyReplyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Reply text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  const openTweetReply = (tweetId: string, replyText: string) => {
    // Copy reply text to clipboard first
    copyReplyText(replyText);
    
    // Open Twitter reply URL
    const twitterUrl = `https://twitter.com/intent/tweet?in_reply_to=${tweetId}`;
    window.open(twitterUrl, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
      POSTED: "outline",
    };
    
    // Special styling for POSTED status
    if (status === "POSTED") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 flex items-center gap-1">
          <Check className="w-3 h-3" />
          {status}
        </Badge>
      );
    }
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };


  // Client-side filtering and sorting
  const filteredTasks = tasks
    .filter((task) => {
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesCampaign = campaignFilter === "all" || task.campaignId.toString() === campaignFilter;
      const matchesMode = modeFilter === "all" || task.mode === modeFilter;
      return matchesStatus && matchesCampaign && matchesMode;
    })
    .sort((a, b) => {
      // Sort by createdAt descending (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return <div className="p-8">Loading tasks...</div>;
  }

  return (
    <div className="container mx-auto p-8 animate-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Reply Tasks
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage AI-generated tweet replies
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6 shadow-modern border-0 hover-lift">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="POSTED">Posted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Campaign</label>
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mode</label>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="AUTO">Auto</SelectItem>
                <SelectItem value="SEMI_AUTO">Semi-Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="p-12 text-center shadow-modern border-0">
            <p className="text-muted-foreground text-lg">No tasks found</p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="p-6 shadow-modern hover-lift border-0 transition-smooth">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Task #{task.id}</h3>
                    {getStatusBadge(task.status)}
                    <Badge variant="outline">{task.mode}</Badge>
                    {task.isRisky && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Risky
                      </Badge>
                    )}
                  </div>
                  
                  <div 
                    className="flex items-center gap-2 text-sm text-muted-foreground mb-4 cursor-help"
                    title={formatFullDate(task.createdAt)}
                  >
                    <Clock className="w-4 h-4" />
                    {formatRelativeTime(task.createdAt)}
                  </div>

                  {/* Original Tweet */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>@{task.tweetAuthor}</strong>
                    </p>
                    <p className="text-sm bg-muted p-3 rounded">
                      {task.tweetText}
                    </p>
                  </div>

                  {/* Generated Reply */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Generated Reply:</p>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 p-4 rounded-lg relative backdrop-blur-sm">
                      <p className="text-sm pr-20">{task.replyText}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyReplyText(task.replyText)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {task.isRisky && task.riskReason && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2 text-destructive">
                        Risk Warning:
                      </p>
                      <p className="text-sm text-destructive">{task.riskReason}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => openTweetReply(task.tweetId, task.replyText)}
                    className="flex items-center gap-2 gradient-primary hover:opacity-90 transition-smooth shadow-modern"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Reply on Twitter
                  </Button>

                  {task.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => markPosted(task.id)}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-smooth shadow-modern"
                      >
                        <Check className="w-4 h-4" />
                        Mark Posted
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => discardTask(task.id)}
                        className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 transition-smooth"
                      >
                        <X className="w-4 h-4" />
                        Discard
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

