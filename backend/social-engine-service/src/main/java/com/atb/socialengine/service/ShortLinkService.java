package com.atb.socialengine.service;

import com.atb.socialengine.entity.ShortLinkLog;
import com.atb.socialengine.repository.ShortLinkLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * ShortLinkService - Generates unique short URLs for product links
 * 
 * Uses Bitly API with fallback to random hash generation
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ShortLinkService {
    
    private final ShortLinkLogRepository shortLinkLogRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Value("${bitly.token:}")
    private String bitlyToken;
    
    @Value("${bitly.api.url:https://api-ssl.bitly.com/v4/shorten}")
    private String bitlyApiUrl;
    
    private static final String CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    
    /**
     * Generate a short link for a product URL
     * 
     * @param originalUrl The full Amazon product URL
     * @param productId The product ID
     * @param campaignId The campaign ID
     * @return The short URL
     */
    @SuppressWarnings("null")
    public String generateShortLink(String originalUrl, Long productId, Long campaignId) {
        try {
            // Check if we already have a short link for this URL and campaign
            Optional<ShortLinkLog> existing = shortLinkLogRepository
                    .findFirstByOriginalUrlAndCampaignId(originalUrl, campaignId);
            
            if (existing.isPresent()) {
                log.info("Reusing existing short link: {}", existing.get().getShortUrl());
                return existing.get().getShortUrl();
            }
            
            // Try Bitly first if token is available
            String shortUrl;
            String provider;
            
            if (bitlyToken != null && !bitlyToken.isEmpty()) {
                try {
                    shortUrl = createBitlyLink(originalUrl);
                    provider = "BITLY";
                    log.info("Generated Bitly short link: {}", shortUrl);
                } catch (Exception e) {
                    log.warn("Bitly API failed, using fallback: {}", e.getMessage());
                    shortUrl = createFallbackLink(originalUrl);
                    provider = "FALLBACK";
                }
            } else {
                log.info("No Bitly token configured, using fallback method");
                shortUrl = createFallbackLink(originalUrl);
                provider = "FALLBACK";
            }
            
            // Save to database
            ShortLinkLog logEntry = ShortLinkLog.builder()
                    .originalUrl(originalUrl)
                    .shortUrl(shortUrl)
                    .productId(productId)
                    .campaignId(campaignId)
                    .linkProvider(provider)
                    .build();
            
            shortLinkLogRepository.save(logEntry);
            
            return shortUrl;
            
        } catch (Exception e) {
            log.error("Error generating short link, returning original URL", e);
            return originalUrl;
        }
    }
    
    /**
     * Create a short link using Bitly API
     */
    @SuppressWarnings("null")
    private String createBitlyLink(String originalUrl) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(bitlyToken);
        
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("long_url", originalUrl);
        
        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
        
        String response = restTemplate.postForObject(bitlyApiUrl, request, String.class);
        
        JsonNode jsonNode = objectMapper.readTree(response);
        return jsonNode.get("link").asText();
    }
    
    /**
     * Create a fallback short link with random hash parameter
     * Format: originalUrl?ref=RANDOM_HASH
     */
    private String createFallbackLink(String originalUrl) {
        String randomHash = generateRandomHash(8);
        
        // Add as query parameter
        String separator = originalUrl.contains("?") ? "&" : "?";
        return originalUrl + separator + "ref=" + randomHash;
    }
    
    /**
     * Generate a random alphanumeric hash
     */
    private String generateRandomHash(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }
}

