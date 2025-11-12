package com.atb.socialengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for Campaign information from campaign-service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignDto {
    
    private Long id;
    private String name;
    private Long productId;
    private String status;
    private String mode; // AUTO or SEMI_AUTO
    private List<String> hashtags;
    private List<String> keywords;
    private String targetAudience;
}

