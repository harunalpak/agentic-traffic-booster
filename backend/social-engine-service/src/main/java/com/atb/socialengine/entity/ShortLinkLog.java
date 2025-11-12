package com.atb.socialengine.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ShortLinkLog entity - Maintains a log of generated short URLs
 */
@Entity
@Table(name = "short_link_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShortLinkLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id")
    private Long productId;
    
    @Column(name = "campaign_id")
    private Long campaignId;
    
    @Column(name = "original_url", nullable = false, length = 1024)
    private String originalUrl;
    
    @Column(name = "short_url", nullable = false, unique = true)
    private String shortUrl;
    
    @Column(name = "link_provider")
    private String linkProvider; // BITLY, FALLBACK
    
    @Column(name = "click_count")
    private Integer clickCount = 0;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

