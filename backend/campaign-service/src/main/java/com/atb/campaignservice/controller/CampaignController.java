package com.atb.campaignservice.controller;

import com.atb.campaignservice.dto.CampaignRequest;
import com.atb.campaignservice.dto.CampaignResponse;
import com.atb.campaignservice.dto.ChannelTypeResponse;
import com.atb.campaignservice.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    /**
     * GET /api/campaigns - Get all campaigns
     */
    @GetMapping
    public ResponseEntity<List<CampaignResponse>> getAllCampaigns() {
        List<CampaignResponse> campaigns = campaignService.getAllCampaigns();
        return ResponseEntity.ok(campaigns);
    }

    /**
     * GET /api/campaigns/{id} - Get campaign by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getCampaignById(@PathVariable Long id) {
        CampaignResponse campaign = campaignService.getCampaignById(id);
        return ResponseEntity.ok(campaign);
    }

    /**
     * POST /api/campaigns - Create new campaign
     */
    @PostMapping
    public ResponseEntity<CampaignResponse> createCampaign(@Valid @RequestBody CampaignRequest request) {
        CampaignResponse campaign = campaignService.createCampaign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(campaign);
    }

    /**
     * PATCH /api/campaigns/{id}/pause - Pause campaign
     */
    @PatchMapping("/{id}/pause")
    public ResponseEntity<CampaignResponse> pauseCampaign(@PathVariable Long id) {
        CampaignResponse campaign = campaignService.pauseCampaign(id);
        return ResponseEntity.ok(campaign);
    }

    /**
     * PATCH /api/campaigns/{id}/resume - Resume campaign
     */
    @PatchMapping("/{id}/resume")
    public ResponseEntity<CampaignResponse> resumeCampaign(@PathVariable Long id) {
        CampaignResponse campaign = campaignService.resumeCampaign(id);
        return ResponseEntity.ok(campaign);
    }

    /**
     * DELETE /api/campaigns/{id} - Delete campaign
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable Long id) {
        campaignService.deleteCampaign(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/campaigns/channel-types - Get available channel types with config fields
     */
    @GetMapping("/channel-types")
    public ResponseEntity<List<ChannelTypeResponse>> getChannelTypes() {
        List<ChannelTypeResponse> channelTypes = campaignService.getChannelTypes();
        return ResponseEntity.ok(channelTypes);
    }
}

