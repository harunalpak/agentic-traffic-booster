"use client";

import { Twitter, Youtube, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/campaign";

interface ChannelSelectorProps {
  onSelect: (channel: Channel) => void;
  selectedChannel?: Channel | null;
}

const channels = [
  {
    value: "TWITTER" as Channel,
    label: "Twitter",
    icon: Twitter,
    description: "Automate Twitter engagement and traffic",
    color: "text-blue-400",
  },
  {
    value: "YOUTUBE" as Channel,
    label: "YouTube",
    icon: Youtube,
    description: "Automate YouTube engagement and traffic",
    color: "text-red-500",
  },
  {
    value: "PINTEREST" as Channel,
    label: "Pinterest",
    icon: MessageSquare,
    description: "Automate Pinterest engagement and traffic",
    color: "text-red-600",
  },
];

export function ChannelSelector({ onSelect, selectedChannel }: ChannelSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {channels.map((channel) => {
        const Icon = channel.icon;
        const isSelected = selectedChannel === channel.value;

        return (
          <Card
            key={channel.value}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={() => onSelect(channel.value)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <Icon className={cn("h-8 w-8", channel.color)} />
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <CardTitle className="text-lg">{channel.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{channel.description}</CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

