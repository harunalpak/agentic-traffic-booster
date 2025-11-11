package com.atb.campaignservice.dto;

import com.atb.campaignservice.enums.CampaignStatus;
import com.atb.campaignservice.enums.Channel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignResponse {

    private Long id;
    private Long productId;
    private String name;
    private Channel channel;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer dailyLimit;
    private CampaignStatus status;
    private Map<String, Object> config;
    private LocalDateTime createdAt;
}

