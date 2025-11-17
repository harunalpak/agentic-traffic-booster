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
     * @param shortLink Optional short link to the product (may be appended in ~1/3 of replies)
     * @return Map with replyText, isRisky, and riskReason
     */
    @SuppressWarnings("null")
    public Map<String, Object> generateResponseWithAnalysis(String tweetText, String productTitle, String shortLink) {
        try {
            String prompt = buildPrompt(tweetText, productTitle);
            
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
            
            // 1) Extra safety: strip any links/hashtags if model still adds them
            String rawReplyText = (String) result.get("replyText");
            String sanitizedReplyText = sanitizeReply(rawReplyText);
            
            // 2) Optional soft CTA to bio
            String withCta = maybeAddSoftCta(sanitizedReplyText);
            
            // 3) In ~1/3 of replies, append the product short link at the end
            String finalReply = maybeAddShortLink(withCta, shortLink);
            
            result.put("replyText", finalReply);
            
            log.info("ChatGPT reply generated (sanitized + optional link): {}", 
                     finalReply.substring(0, Math.min(80, finalReply.length())));
            log.info("Safety analysis - Risky: {}, Reason: {}", result.get("isRisky"), result.get("riskReason"));
            
            return result;
            
        } catch (Exception e) {
            log.error("Error generating ChatGPT response", e);
            Map<String, Object> fallback = new HashMap<>();
            String fallbackText = generateFallbackResponse(productTitle);
            // Apply same CTA + optional link logic to fallback
            fallbackText = maybeAddSoftCta(sanitizeReply(fallbackText));
            fallbackText = maybeAddShortLink(fallbackText, shortLink);
            fallback.put("replyText", fallbackText);
            fallback.put("isRisky", false);
            fallback.put("riskReason", null);
            return fallback;
        }
    }
    
    /**
     * Legacy method for backward compatibility
     */
    public String generateResponse(String tweetText, String productTitle, String shortLink) {
        Map<String, Object> result = generateResponseWithAnalysis(tweetText, productTitle, shortLink);
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
     * 
     * NOTE: Replies MUST be link-free and hashtag-free. Soft CTA should point to bio.
     */
    private String buildPrompt(String tweetText, String productTitle) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Original Tweet:\n");
        prompt.append("\"").append(tweetText).append("\"\n\n");
        
        prompt.append("Product to keep in mind (for your own context only, DO NOT mention brand names explicitly):\n");
        prompt.append("\"").append(productTitle).append("\"\n\n");
        
        prompt.append("Your Tasks:\n\n");
        
        prompt.append("1. ANALYZE THE TWEET:\n");
        prompt.append("   - Is it risky/controversial?\n");
        prompt.append("   - Consider: political content, offensive language, sensitive topics, polarizing issues\n");
        prompt.append("   - If risky, briefly explain why in 1-2 sentences\n\n");
        
        prompt.append("2. WRITE THE REPLY (VERY IMPORTANT RULES):\n");
        prompt.append("   - Sound like a normal human replying, not a brand or advertiser\n");
        prompt.append("   - Directly react to the original tweet (comment on what they said)\n");
        prompt.append("   - Use a casual, conversational tone (can be friendly, funny, or neutral)\n");
        prompt.append("   - KEEP IT SHORT: 80–180 characters total\n");
        prompt.append("   - DO NOT include ANY URL or link (no Etsy, Amazon, tracking, short links, etc.)\n");
        prompt.append("   - DO NOT include ANY hashtags\n");
        prompt.append("   - DO NOT use sales language: no 'check this out', 'buy now', 'get this', 'here's the product', etc.\n");
        prompt.append("   - Optional soft call-to-action at the end that points to the bio, WITHOUT links. Examples:\n");
        prompt.append("       * \"More is in my bio 😊\"\n");
        prompt.append("       * \"I share the designs in my bio btw!\"\n");
        prompt.append("       * \"If you like this stuff, I put some in my bio 🦃\"\n");
        prompt.append("       * \"I dropped some holiday ideas in my bio!\"\n");
        prompt.append("   - You can randomly choose to:\n");
        prompt.append("       * include a soft CTA or not\n");
        prompt.append("       * use 0, 1, or 2 emojis (never more than 2)\n");
        prompt.append("       * vary tone: sometimes friendly, sometimes funny, sometimes neutral\n");
        prompt.append("   - Avoid repeating the same sentence structure across different replies.\n\n");
        
        prompt.append("Important Hard Rules:\n");
        prompt.append("❌ NO links of any kind\n");
        prompt.append("❌ NO hashtags\n");
        prompt.append("❌ NO affiliate or promotional wording\n");
        prompt.append("❌ NO copy-paste feeling or template-like replies\n");
        prompt.append("✅ Feels like a real person reacting to the tweet\n");
        prompt.append("✅ Light, natural, and context-aware\n");
        prompt.append("✅ Optional, gentle bio reference instead of a direct product pitch\n\n");
        
        prompt.append("REQUIRED JSON FORMAT:\n");
        prompt.append("{\n");
        prompt.append("  \"replyText\": \"Your short, conversational reply here (no links, no hashtags)\",\n");
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
        return "You are a creative, human-like social media assistant who replies to tweets naturally. " +
               "Your job is to: " +
               "1) React to tweets in a short, conversational, and authentic way (80–180 characters) " +
               "2) NEVER include links or hashtags in replies " +
               "3) Avoid any sales or promotional language – you are not an ad, you are a person talking " +
               "4) Optionally add a very soft call-to-action that mentions the bio (e.g. 'I put some in my bio btw') " +
               "5) Vary tone and structure so replies do not look templated or repetitive. " +
               "Your replies should always feel like a real person replying, not marketing copy.";
    }
    
    /**
     * Generate a simple fallback response if ChatGPT fails
     * (Must also respect no-links, no-hashtags policy)
     */
    private String generateFallbackResponse(String productTitle) {
        // Simple, safe, link-free, hashtag-free backup reply
        String[] variants = new String[] {
            "Holiday vibes lately, been working on some fun designs in my bio 😊",
            "This season has me inspired, dropped a few ideas in my bio!",
            "Been in a creative mood too lol, put some of it in my bio.",
            "All this holiday energy is real – I parked a few things in my bio if you're curious."
        };
        
        int idx = (int) (Math.random() * variants.length);
        return variants[idx];
    }

    /**
     * Ensure reply text obeys hard rules:
     * - No links or URLs
     * - No hashtags
     * - Reasonable length (80–180 chars if possible)
     */
    private String sanitizeReply(String replyText) {
        if (replyText == null) {
            return "";
        }

        String sanitized = replyText;

        // Remove URLs (http/https)
        sanitized = sanitized.replaceAll("https?://\\S+", "");

        // Remove bare domains (example.com, bit.ly/xyz, etc.)
        sanitized = sanitized.replaceAll("\\b\\S+\\.(com|net|org|io|co|ly|gg|shop|store)(/\\S*)?", "");

        // Remove hashtags
        sanitized = sanitized.replaceAll("#\\w+", "");

        // Remove leftover multiple spaces
        sanitized = sanitized.replaceAll("\\s+", " ").trim();

        // Enforce max length ~180 chars (but don't cut mid-word too harshly)
        int maxLength = 180;
        if (sanitized.length() > maxLength) {
            int cutIndex = sanitized.lastIndexOf(' ', maxLength);
            if (cutIndex == -1) {
                cutIndex = maxLength;
            }
            sanitized = sanitized.substring(0, cutIndex).trim();
        }

        return sanitized;
    }

    /**
     * Optionally append a soft CTA pointing to bio, without links or hashtags.
     * Adds variation and keeps replies natural.
     */
    private String maybeAddSoftCta(String replyText) {
        if (replyText == null || replyText.isEmpty()) {
            return replyText;
        }

        // If reply already mentions bio, don't add another CTA
        String lower = replyText.toLowerCase();
        if (lower.contains("bio")) {
            return replyText;
        }

        // 60% chance to add a CTA
        if (Math.random() > 0.6) {
            return replyText;
        }

        String[] ctas = new String[] {
            "More is in my bio 😊",
            "I share the designs in my bio btw!",
            "If you like this stuff, I put some in my bio 🦃",
            "I dropped some holiday ideas in my bio!"
        };

        String cta = ctas[(int) (Math.random() * ctas.length)];

        String combined;
        if (replyText.endsWith("!") || replyText.endsWith("?") || replyText.endsWith(".")) {
            combined = replyText + " " + cta;
        } else {
            combined = replyText + " — " + cta;
        }

        // Final safety pass to respect max length
        return sanitizeReply(combined);
    }

    /**
     * With ~1/3 probability, append the short link to the reply.
     * Never modifies the core text (which is already sanitized).
     */
    private String maybeAddShortLink(String replyText, String shortLink) {
        if (shortLink == null || shortLink.isEmpty()) {
            return replyText;
        }

        // Roughly 1/3 chance to include a link
        if (Math.random() > (1.0 / 3.0)) {
            return replyText;
        }

        // Keep it simple: just add the short link at the end
        String combined;
        if (replyText == null || replyText.isEmpty()) {
            combined = shortLink;
        } else if (replyText.endsWith("!") || replyText.endsWith("?") || replyText.endsWith(".")) {
            combined = replyText + " " + shortLink;
        } else {
            combined = replyText + " - " + shortLink;
        }

        // Do NOT run sanitizeReply again here; we want to keep the link.
        return combined;
    }
}

