package com.atb.socialengine.service;

import com.atb.socialengine.dto.CampaignDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

/**
 * CampaignClientService - Communicates with campaign-service
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CampaignClientService {
    
    private final WebClient.Builder webClientBuilder;
    
    @Value("${campaign.service.url:http://localhost:8082}")
    private String campaignServiceUrl;
    
    /**
     * Fetch all active campaigns
     */
    @SuppressWarnings("null")
    public List<CampaignDto> getActiveCampaigns() {
        try {
            log.info("Fetching active campaigns from: {}", campaignServiceUrl);
            
            WebClient webClient = webClientBuilder.baseUrl(campaignServiceUrl).build();
            
            CampaignDto[] campaigns = webClient.get()
                    .uri("/api/campaigns?status=ACTIVE")
                    .retrieve()
                    .bodyToMono(CampaignDto[].class)
                    .block();
            
            List<CampaignDto> campaignList = campaigns != null ? List.of(campaigns) : List.of();
            log.info("Retrieved {} active campaigns", campaignList.size());
            
            return campaignList;
            
        } catch (Exception e) {
            log.error("Error fetching active campaigns", e);
            return List.of();
        }
    }
    
    /**
     * Fetch a specific campaign by ID
     */
    @SuppressWarnings("null")
    public CampaignDto getCampaignById(Long campaignId) {
        try {
            log.info("Fetching campaign {} from: {}", campaignId, campaignServiceUrl);
            
            WebClient webClient = webClientBuilder.baseUrl(campaignServiceUrl).build();
            
            return webClient.get()
                    .uri("/api/campaigns/" + campaignId)
                    .retrieve()
                    .bodyToMono(CampaignDto.class)
                    .block();
                    
        } catch (Exception e) {
            log.error("Error fetching campaign {}", campaignId, e);
            return null;
        }
    }
}

