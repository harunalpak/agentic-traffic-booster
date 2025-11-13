"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { twitterConfigSchema, youtubeConfigSchema, pinterestConfigSchema } from "@/lib/validators/campaign";
import type { Channel } from "@/types/campaign";
import type { z } from "zod";

interface ChannelConfigFormProps {
  channel: Channel;
  onNext: (config: Record<string, any>) => void;
  initialData?: Record<string, any>;
}

export function ChannelConfigForm({ channel, onNext, initialData }: ChannelConfigFormProps) {
  if (channel === "TWITTER") {
    return <TwitterConfigForm onNext={onNext} initialData={initialData} />;
  } else if (channel === "YOUTUBE") {
    return <YoutubeConfigForm onNext={onNext} initialData={initialData} />;
  } else if (channel === "PINTEREST") {
    return <PinterestConfigForm onNext={onNext} initialData={initialData} />;
  }
  return null;
}

// Twitter Config
type TwitterConfig = z.infer<typeof twitterConfigSchema>;

function TwitterConfigForm({ onNext, initialData }: { onNext: (config: any) => void; initialData?: any }) {
  const [hashtags, setHashtags] = useState<string[]>(initialData?.hashtags || []);
  const [hashtagInput, setHashtagInput] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwitterConfig>({
    resolver: zodResolver(twitterConfigSchema),
    defaultValues: {
      minFollowerCount: initialData?.minFollowerCount || 0,
      hashtags: initialData?.hashtags || [],
      recentWindowMinutes: initialData?.recentWindowMinutes || 15,
    },
  });

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags([...hashtags, hashtagInput.trim()]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const onSubmit = (data: TwitterConfig) => {
    onNext({
      minFollowerCount: data.minFollowerCount,
      hashtags,
      recentWindowMinutes: data.recentWindowMinutes,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="minFollowerCount">Minimum Follower Count</Label>
        <Input
          id="minFollowerCount"
          type="number"
          placeholder="e.g., 500"
          {...register("minFollowerCount")}
        />
        {errors.minFollowerCount && (
          <p className="text-sm text-destructive">{errors.minFollowerCount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="recentWindowMinutes">Recent Window (Minutes)</Label>
        <Input
          id="recentWindowMinutes"
          type="number"
          placeholder="e.g., 15"
          {...register("recentWindowMinutes")}
        />
        <p className="text-xs text-muted-foreground">
          Only scan tweets from the last X minutes (default: 15)
        </p>
        {errors.recentWindowMinutes && (
          <p className="text-sm text-destructive">{errors.recentWindowMinutes.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hashtags">Hashtags</Label>
        <div className="flex gap-2">
          <Input
            id="hashtags"
            placeholder="e.g., #sale"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addHashtag();
              }
            }}
          />
          <Button type="button" onClick={addHashtag}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {hashtags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeHashtag(tag)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}

// YouTube Config
type YoutubeConfig = z.infer<typeof youtubeConfigSchema>;

function YoutubeConfigForm({ onNext, initialData }: { onNext: (config: any) => void; initialData?: any }) {
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<YoutubeConfig>({
    resolver: zodResolver(youtubeConfigSchema),
    defaultValues: {
      minSubscribers: initialData?.minSubscribers || 0,
      keywords: initialData?.keywords || [],
    },
  });

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const onSubmit = (data: YoutubeConfig) => {
    onNext({
      minSubscribers: data.minSubscribers,
      keywords,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="minSubscribers">Minimum Subscribers</Label>
        <Input
          id="minSubscribers"
          type="number"
          placeholder="e.g., 1000"
          {...register("minSubscribers")}
        />
        {errors.minSubscribers && (
          <p className="text-sm text-destructive">{errors.minSubscribers.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords</Label>
        <div className="flex gap-2">
          <Input
            id="keywords"
            placeholder="e.g., review, unboxing"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addKeyword();
              }
            }}
          />
          <Button type="button" onClick={addKeyword}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="gap-1">
              {keyword}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeKeyword(keyword)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}

// Pinterest Config
type PinterestConfig = z.infer<typeof pinterestConfigSchema>;

function PinterestConfigForm({ onNext, initialData }: { onNext: (config: any) => void; initialData?: any }) {
  const [boards, setBoards] = useState<string[]>(initialData?.boards || []);
  const [boardInput, setBoardInput] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PinterestConfig>({
    resolver: zodResolver(pinterestConfigSchema),
    defaultValues: {
      minFollowers: initialData?.minFollowers || 0,
      boards: initialData?.boards || [],
    },
  });

  const addBoard = () => {
    if (boardInput.trim() && !boards.includes(boardInput.trim())) {
      setBoards([...boards, boardInput.trim()]);
      setBoardInput("");
    }
  };

  const removeBoard = (board: string) => {
    setBoards(boards.filter(b => b !== board));
  };

  const onSubmit = (data: PinterestConfig) => {
    onNext({
      minFollowers: data.minFollowers,
      boards,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="minFollowers">Minimum Followers</Label>
        <Input
          id="minFollowers"
          type="number"
          placeholder="e.g., 300"
          {...register("minFollowers")}
        />
        {errors.minFollowers && (
          <p className="text-sm text-destructive">{errors.minFollowers.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="boards">Boards</Label>
        <div className="flex gap-2">
          <Input
            id="boards"
            placeholder="e.g., Fashion, Home Decor"
            value={boardInput}
            onChange={(e) => setBoardInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addBoard();
              }
            }}
          />
          <Button type="button" onClick={addBoard}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {boards.map((board) => (
            <Badge key={board} variant="secondary" className="gap-1">
              {board}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeBoard(board)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}

