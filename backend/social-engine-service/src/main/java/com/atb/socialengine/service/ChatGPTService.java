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
     * Generate a conversational reply for a tweet with safety analysis
     * 
     * @param tweetText The original tweet text
     * @param productTitle The product to promote
     * @param shortLink The short link to the product
     * @param hashtags Unused (kept for backward compatibility) - ChatGPT generates contextual hashtags
     * @return Map with replyText, isRisky, and riskReason
     */
    public Map<String, Object> generateResponseWithAnalysis(String tweetText, String productTitle, String shortLink, List<String> hashtags) {
        try {
            String prompt = buildPrompt(tweetText, productTitle, shortLink);
            
            log.info("Generating ChatGPT response with safety analysis for tweet: {}", tweetText.substring(0, Math.min(50, tweetText.length())));
            
            // Debug: Check API key
            if (openaiApiKey == null || openaiApiKey.isEmpty()) {
                log.error("❌ OpenAI API key is NULL or EMPTY!");
            } else {
                String maskedKey = openaiApiKey.substring(0, Math.min(10, openaiApiKey.length())) + "..." + 
                                  openaiApiKey.substring(Math.max(0, openaiApiKey.length() - 10));
                log.info("🔑 Using OpenAI API key: {} (length: {})", maskedKey, openaiApiKey.length());
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("temperature", temperature);
            requestBody.put("max_tokens", 200); // Increased for JSON response
            
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
            
            // Parse JSON response
            Map<String, Object> result = parseAnalysisResponse(reply);
            
            log.info("ChatGPT reply generated: {}", ((String)result.get("replyText")).substring(0, Math.min(50, ((String)result.get("replyText")).length())));
            log.info("Safety analysis - Risky: {}, Reason: {}", result.get("isRisky"), result.get("riskReason"));
            
            return result;
            
        } catch (Exception e) {
            log.error("Error generating ChatGPT response", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("replyText", generateFallbackResponse(productTitle, shortLink, hashtags));
            fallback.put("isRisky", false);
            fallback.put("riskReason", null);
            return fallback;
        }
    }
    
    /**
     * Legacy method for backward compatibility
     */
    public String generateResponse(String tweetText, String productTitle, String shortLink, List<String> hashtags) {
        Map<String, Object> result = generateResponseWithAnalysis(tweetText, productTitle, shortLink, hashtags);
        return (String) result.get("replyText");
    }
    
    /**
     * Parse ChatGPT's JSON response containing reply and safety analysis
     */
    private Map<String, Object> parseAnalysisResponse(String response) {
        try {
            // Try to parse as JSON first
            JsonNode jsonNode = objectMapper.readTree(response);
            
            Map<String, Object> result = new HashMap<>();
            result.put("replyText", jsonNode.get("replyText").asText());
            result.put("isRisky", jsonNode.get("isRisky").asBoolean());
            result.put("riskReason", jsonNode.has("riskReason") && !jsonNode.get("riskReason").isNull() 
                ? jsonNode.get("riskReason").asText() : null);
            
            return result;
            
        } catch (Exception e) {
            // If JSON parsing fails, treat as plain text
            log.warn("Failed to parse JSON response, treating as plain text");
            Map<String, Object> result = new HashMap<>();
            result.put("replyText", response);
            result.put("isRisky", false);
            result.put("riskReason", null);
            return result;
        }
    }
    
    /**
     * Build the user prompt with tweet context and product info
     */
    private String buildPrompt(String tweetText, String productTitle, String shortLink) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Original Tweet:\n");
        prompt.append("\"").append(tweetText).append("\"\n\n");
        
        prompt.append("Product to Recommend:\n");
        prompt.append("\"").append(productTitle).append("\"\n\n");
        
        prompt.append("Product Link:\n");
        prompt.append(shortLink).append("\n\n");
        
        prompt.append("Your Tasks:\n\n");
        
        prompt.append("1. ANALYZE THE TWEET:\n");
        prompt.append("   - Is it risky/controversial?\n");
        prompt.append("   - Consider: political content, offensive language, sensitive topics, polarizing issues\n");
        prompt.append("   - If risky, briefly explain why in 1-2 sentences\n\n");
        
        prompt.append("2. WRITE THE REPLY:\n");
        prompt.append("   - Fun, engaging, and authentic\n");
        prompt.append("   - Naturally recommend the product (don't force it!)\n");
        prompt.append("   - Generate 2-3 creative hashtags that fit the tweet's vibe\n");
        prompt.append("   - Keep under 250 characters total\n");
        prompt.append("   - Include the product link at the end\n\n");
        
        prompt.append("Important Rules:\n");
        prompt.append("❌ Don't sound like a salesperson or advertiser\n");
        prompt.append("❌ Don't use corporate language or buzzwords\n");
        prompt.append("❌ Don't be pushy or overly promotional\n");
        prompt.append("✅ Be funny, authentic, and helpful\n");
        prompt.append("✅ Match the tone and energy of the original tweet\n");
        prompt.append("✅ Make it feel like a friend's recommendation\n\n");
        
        prompt.append("REQUIRED JSON FORMAT:\n");
        prompt.append("{\n");
        prompt.append("  \"replyText\": \"Your reply here with link and hashtags\",\n");
        prompt.append("  \"isRisky\": true/false,\n");
        prompt.append("  \"riskReason\": \"Brief explanation if risky, otherwise null\"\n");
        prompt.append("}\n\n");
        
        prompt.append("Return ONLY the JSON, no additional text.\n");
        
        return prompt.toString();
    }
    
    /**
     * System prompt defining the AI's role and behavior
     */
    private String getSystemPrompt() {
        return "You are a creative, fun social media assistant who replies to tweets naturally. " +
               "Your job is to: " +
               "1) Reply to tweets in an entertaining, engaging, and authentic way " +
               "2) Subtly recommend relevant Amazon Handmade products when it fits naturally " +
               "3) Generate creative hashtags that match the tweet's topic and tone " +
               "4) Keep replies conversational and human-like - NO corporate speak " +
               "5) Add value to the conversation while gently promoting the product " +
               "Your replies should feel like they're from a cool friend, not a salesperson.";
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

