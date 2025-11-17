package com.atb.campaignservice.service;

import com.atb.campaignservice.dto.CampaignRequest;
import com.atb.campaignservice.dto.CampaignResponse;
import com.atb.campaignservice.dto.ChannelTypeResponse;
import com.atb.campaignservice.entity.Campaign;
import com.atb.campaignservice.enums.CampaignStatus;
import com.atb.campaignservice.exception.InvalidOperationException;
import com.atb.campaignservice.exception.ResourceNotFoundException;
import com.atb.campaignservice.repository.CampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;

    /**
     * Get all campaigns
     */
    public List<CampaignResponse> getAllCampaigns() {
        return campaignRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get campaign by ID
     */
    public CampaignResponse getCampaignById(Long id) {
        Campaign campaign = findCampaignById(id);
        return mapToResponse(campaign);
    }

    /**
     * Create a new campaign with default status DRAFT
     */
    @Transactional
    public CampaignResponse createCampaign(CampaignRequest request) {
        // Validate dates
        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidOperationException("End date cannot be before start date");
        }

        Campaign campaign = Campaign.builder()
                .productId(request.getProductId())
                .name(request.getName())
                .channel(request.getChannel())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .dailyLimit(request.getDailyLimit())
                .status(CampaignStatus.DRAFT)
                .config(request.getConfig())
                .build();

        Campaign savedCampaign = campaignRepository.save(campaign);
        return mapToResponse(savedCampaign);
    }

    /**
     * Update an existing campaign
     */
    @Transactional
    public CampaignResponse updateCampaign(Long id, CampaignRequest request) {
        Campaign campaign = findCampaignById(id);

        // Only prevent updates for COMPLETED campaigns
        if (campaign.getStatus() == CampaignStatus.COMPLETED) {
            throw new InvalidOperationException("COMPLETED campaigns cannot be updated");
        }

        // Validate dates
        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidOperationException("End date cannot be before start date");
        }

        campaign.setProductId(request.getProductId());
        campaign.setName(request.getName());
        campaign.setChannel(request.getChannel());
        campaign.setStartDate(request.getStartDate());
        campaign.setEndDate(request.getEndDate());
        campaign.setDailyLimit(request.getDailyLimit());
        campaign.setConfig(request.getConfig());

        Campaign updatedCampaign = campaignRepository.save(campaign);
        return mapToResponse(updatedCampaign);
    }

    /**
     * Pause a campaign (change status to PAUSED)
     */
    @Transactional
    public CampaignResponse pauseCampaign(Long id) {
        Campaign campaign = findCampaignById(id);

        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new InvalidOperationException("Only ACTIVE campaigns can be paused");
        }

        campaign.setStatus(CampaignStatus.PAUSED);
        Campaign updatedCampaign = campaignRepository.save(campaign);
        return mapToResponse(updatedCampaign);
    }

    /**
     * Resume a campaign (change status to ACTIVE)
     */
    @Transactional
    public CampaignResponse resumeCampaign(Long id) {
        Campaign campaign = findCampaignById(id);

        if (campaign.getStatus() == CampaignStatus.COMPLETED) {
            throw new InvalidOperationException("COMPLETED campaigns cannot be resumed");
        }

        campaign.setStatus(CampaignStatus.ACTIVE);
        Campaign updatedCampaign = campaignRepository.save(campaign);
        return mapToResponse(updatedCampaign);
    }

    /**
     * Delete a campaign
     */
    @Transactional
    public void deleteCampaign(Long id) {
        Campaign campaign = findCampaignById(id);
        campaignRepository.delete(campaign);
    }

    /**
     * Get available channel types with their configuration fields
     */
    public List<ChannelTypeResponse> getChannelTypes() {
        List<ChannelTypeResponse> channelTypes = new ArrayList<>();

        // Twitter
        channelTypes.add(ChannelTypeResponse.builder()
                .name("TWITTER")
                .displayName("Twitter")
                .description("Automate Twitter engagement and traffic")
                .configFields(Arrays.asList("minFollowerCount", "hashtags"))
                .build());

        // YouTube
        channelTypes.add(ChannelTypeResponse.builder()
                .name("YOUTUBE")
                .displayName("YouTube")
                .description("Automate YouTube engagement and traffic")
                .configFields(Arrays.asList("minSubscribers", "keywords"))
                .build());

        // Pinterest
        channelTypes.add(ChannelTypeResponse.builder()
                .name("PINTEREST")
                .displayName("Pinterest")
                .description("Automate Pinterest engagement and traffic")
                .configFields(Arrays.asList("minFollowers", "boards"))
                .build());

        return channelTypes;
    }

    /**
     * Helper method to find campaign by ID or throw exception
     */
    private Campaign findCampaignById(Long id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found with id: " + id));
    }

    /**
     * Map Campaign entity to CampaignResponse DTO
     */
    private CampaignResponse mapToResponse(Campaign campaign) {
        return CampaignResponse.builder()
                .id(campaign.getId())
                .productId(campaign.getProductId())
                .name(campaign.getName())
                .channel(campaign.getChannel())
                .startDate(campaign.getStartDate())
                .endDate(campaign.getEndDate())
                .dailyLimit(campaign.getDailyLimit())
                .status(campaign.getStatus())
                .config(campaign.getConfig())
                .createdAt(campaign.getCreatedAt())
                .build();
    }
}

