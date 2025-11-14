package com.atb.socialengine.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Task entity - Stores generated reply suggestions for manual review or automation
 */
@Entity
@Table(name = "tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String tweetId;
    
    @Column(nullable = false)
    private Long campaignId;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String replyText;
    
    @Column(nullable = false)
    private String mode; // AUTO or SEMI_AUTO
    
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, POSTED
    
    @Column(name = "tweet_author")
    private String tweetAuthor;
    
    @Column(name = "tweet_text", columnDefinition = "TEXT")
    private String tweetText;
    
    @Column(name = "tweet_url")
    private String tweetUrl;
    
    @Column(name = "confidence_score")
    private Double confidenceScore;
    
    @Column(name = "short_link")
    private String shortLink;
    
    @Column(name = "is_risky")
    private Boolean isRisky;           // true if tweet is potentially risky/controversial
    
    @Column(name = "risk_reason", columnDefinition = "TEXT")
    private String riskReason;         // explanation of why it's risky (if applicable)
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

