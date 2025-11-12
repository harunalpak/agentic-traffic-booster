package com.atb.socialengine.service;

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

import java.util.*;

/**
 * ChatGPTService - Generates intelligent, conversational replies using OpenAI API
 * 
 * Integrates tweet context, product information, and campaign hashtags
 * to create natural, human-like promotional responses
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ChatGPTService {
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Value("${openai.api.key}")
    private String openaiApiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openaiApiUrl;
    
    @Value("${openai.model:gpt-4o-mini}")
    private String model;
    
    @Value("${openai.temperature:0.8}")
    private double temperature;
    
    @Value("${openai.max.tokens:150}")
    private int maxTokens;
    
    /**
     * Generate a conversational reply for a tweet
     * 
     * @param tweetText The original tweet text
     * @param productTitle The product to promote
     * @param shortLink The short link to the product
     * @param hashtags Campaign hashtags
     * @return Generated reply text
     */
    public String generateResponse(String tweetText, String productTitle, String shortLink, List<String> hashtags) {
        try {
            String prompt = buildPrompt(tweetText, productTitle, shortLink, hashtags);
            
            log.info("Generating ChatGPT response for tweet: {}", tweetText.substring(0, Math.min(50, tweetText.length())));
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("temperature", temperature);
            requestBody.put("max_tokens", maxTokens);
            
            List<Map<String, String>> messages = new ArrayList<>();
            
            // System message
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", getSystemPrompt());
            messages.add(systemMessage);
            
            // User message
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            
            requestBody.put("messages", messages);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            String response = restTemplate.postForObject(openaiApiUrl, request, String.class);
            
            JsonNode jsonNode = objectMapper.readTree(response);
            String reply = jsonNode.get("choices").get(0).get("message").get("content").asText().trim();
            
            log.info("ChatGPT reply generated successfully: {}", reply.substring(0, Math.min(50, reply.length())));
            
            return reply;
            
        } catch (Exception e) {
            log.error("Error generating ChatGPT response", e);
            return generateFallbackResponse(productTitle, shortLink, hashtags);
        }
    }
    
    /**
     * Build the user prompt with tweet context and product info
     */
    private String buildPrompt(String tweetText, String productTitle, String shortLink, List<String> hashtags) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Tweet: \"").append(tweetText).append("\"\n\n");
        prompt.append("Product: \"").append(productTitle).append("\"\n");
        prompt.append("Product Link: ").append(shortLink).append("\n");
        
        if (hashtags != null && !hashtags.isEmpty()) {
            prompt.append("Hashtags: ").append(String.join(" ", hashtags)).append("\n");
        }
        
        prompt.append("\nRules:\n");
        prompt.append("- Reply must sound human, friendly, and conversational\n");
        prompt.append("- Mention the product naturally and casually\n");
        prompt.append("- Include hashtags and link at the end\n");
        prompt.append("- Keep under 250 characters\n");
        prompt.append("- Don't be overly promotional or salesy\n");
        prompt.append("- Add value to the conversation\n");
        
        return prompt.toString();
    }
    
    /**
     * System prompt defining the AI's role and behavior
     */
    private String getSystemPrompt() {
        return "You are a creative social media marketer promoting Amazon Handmade products naturally. " +
               "Your replies should be authentic, helpful, and conversational. " +
               "You engage with people genuinely while subtly promoting relevant products. " +
               "Never use corporate language or obvious advertising tactics.";
    }
    
    /**
     * Generate a simple fallback response if ChatGPT fails
     */
    private String generateFallbackResponse(String productTitle, String shortLink, List<String> hashtags) {
        StringBuilder fallback = new StringBuilder();
        fallback.append("You might like this: ").append(productTitle).append(" ");
        fallback.append(shortLink);
        
        if (hashtags != null && !hashtags.isEmpty()) {
            fallback.append(" ").append(String.join(" ", hashtags));
        }
        
        return fallback.toString();
    }
}

