package com.atb.socialengine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tweet DTO - Represents a discovered tweet from Twitter
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tweet {
    
    private String tweetId;
    private Long campaignId;
    private String author;
    private String text;
    private String url;
    private LocalDateTime createdAt;
    
    // Additional metadata
    private Integer likes;
    private Integer retweets;
    private String language;
}

