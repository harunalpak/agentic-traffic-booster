package com.atb.campaignservice.dto;

import com.atb.campaignservice.enums.Channel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotBlank(message = "Campaign name is required")
    private String name;

    @NotNull(message = "Channel is required")
    private Channel channel;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate; // nullable

    @NotNull(message = "Daily limit is required")
    @Positive(message = "Daily limit must be positive")
    private Integer dailyLimit;

    private Map<String, Object> config; // platform-specific configuration
}

