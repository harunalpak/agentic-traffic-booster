package com.atb.socialengine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ReplySuggestion DTO - Represents a ChatGPT-generated reply
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplySuggestion {
    
    private String tweetId;
    private Long campaignId;
    private String replyText;
    private Double confidence;
    private String shortLink;
    @Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Original tweet context
    private String tweetAuthor;
    private String tweetText;
    private String tweetUrl;
    
    // Campaign context
    private String mode; // AUTO or SEMI_AUTO
    
    // Content safety analysis
    private Boolean isRisky;          // true if tweet is potentially risky/controversial
    private String riskReason;        // explanation of why it's risky (if applicable)
}

