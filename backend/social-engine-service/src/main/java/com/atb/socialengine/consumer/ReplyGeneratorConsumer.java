package com.atb.socialengine.consumer;

import com.atb.socialengine.config.KafkaConfig;
import com.atb.socialengine.dto.CampaignDto;
import com.atb.socialengine.dto.ProductDto;
import com.atb.socialengine.model.ReplySuggestion;
import com.atb.socialengine.model.Tweet;
import com.atb.socialengine.service.CampaignClientService;
import com.atb.socialengine.service.ChatGPTService;
import com.atb.socialengine.service.ProductClientService;
import com.atb.socialengine.service.ShortLinkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ReplyGeneratorConsumer - Generates intelligent replies for discovered tweets
 * 
 * Flow:
 * 1. Consume tweets from new_tweets topic
 * 2. Fetch campaign and product information
 * 3. Generate short link for product
 * 4. Use ChatGPT to create natural, conversational reply
 * 5. Publish reply to generated_replies topic (Kafka)
 * 
 * Note: This consumer does NOT save to database directly.
 * The ReplySuggestion is published to Kafka for TaskConsumer to persist.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ReplyGeneratorConsumer {
    
    private final CampaignClientService campaignClientService;
    private final ProductClientService productClientService;
    private final ShortLinkService shortLinkService;
    private final ChatGPTService chatGPTService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    @KafkaListener(
        topics = KafkaConfig.NEW_TWEETS_TOPIC,
        groupId = "${spring.kafka.consumer.group-id}",
        containerFactory = "tweetKafkaListenerContainerFactory"
    )
    public void processNewTweet(Tweet tweet, Acknowledgment acknowledgment) {
        try {
            log.info("========================================");
            log.info("🧠 ReplyGenerator: Processing tweet {}", tweet.getTweetId());
            log.info("   Tweet author: @{}", tweet.getAuthor());
            log.info("   Tweet text: {}", tweet.getText());
            log.info("   Campaign ID: {}", tweet.getCampaignId());
            log.info("========================================");
            
            // 1. Get campaign information
            CampaignDto campaign = campaignClientService.getCampaignById(tweet.getCampaignId());
            
            if (campaign == null) {
                log.warn("⚠️  Campaign {} not found, skipping tweet", tweet.getCampaignId());
                acknowledgment.acknowledge();
                return;
            }
            
            log.info("✅ Campaign: {} (mode: {})", campaign.getName(), campaign.getMode());
            
            // 2. Get product information
            ProductDto product = productClientService.getProductById(campaign.getProductId());
            
            if (product == null) {
                log.warn("⚠️  Product {} not found for campaign {}", campaign.getProductId(), campaign.getId());
                acknowledgment.acknowledge();
                return;
            }
            
            log.info("✅ Product: {}", product.getTitle());
            
            // 3. Generate short link
            String shortLink = shortLinkService.generateShortLink(
                product.getProductUrl(),
                product.getId(),
                campaign.getId()
            );
            
            log.info("🔗 Generated short link: {}", shortLink);
            
            // 4. Generate reply using ChatGPT with risk analysis
            log.info("🤖 Calling ChatGPT to generate reply with safety analysis...");
            Map<String, Object> aiResponse = chatGPTService.generateResponseWithAnalysis(
                tweet.getText(),
                product.getTitle(),
                shortLink,
                new ArrayList<>() // Empty list - ChatGPT generates contextual hashtags
            );
            
            String replyText = (String) aiResponse.get("replyText");
            Boolean isRisky = (Boolean) aiResponse.get("isRisky");
            String riskReason = (String) aiResponse.get("riskReason");
            
            log.info("✅ ChatGPT reply: {}", replyText);
            if (isRisky != null && isRisky) {
                log.warn("⚠️  RISKY CONTENT DETECTED: {}", riskReason);
            }
            
            // 5. Create ReplySuggestion with risk analysis
            ReplySuggestion suggestion = ReplySuggestion.builder()
                .tweetId(tweet.getTweetId())
                .campaignId(campaign.getId())
                .replyText(replyText)
                .confidence(0.85) // Default confidence score
                .shortLink(shortLink)
                .tweetAuthor(tweet.getAuthor())
                .tweetText(tweet.getText())
                .tweetUrl(tweet.getUrl())
                .mode(campaign.getMode() != null ? campaign.getMode() : "SEMI_AUTO") // Default to SEMI_AUTO if not set
                .isRisky(isRisky)
                .riskReason(riskReason)
                .build();
            
            // 7. ✅ Publish to Kafka (generated_replies topic) instead of direct DB insert
            kafkaTemplate.send(KafkaConfig.GENERATED_REPLIES_TOPIC, tweet.getTweetId(), suggestion);
            
            log.info("========================================");
            log.info("✅ ReplyGenerator: Published reply to Kafka");
            log.info("   Topic: {}", KafkaConfig.GENERATED_REPLIES_TOPIC);
            log.info("   Tweet ID: {}", tweet.getTweetId());
            log.info("   Campaign ID: {}", campaign.getId());
            log.info("========================================");
            
            // Acknowledge message
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("❌ Error processing tweet {}: {}", tweet.getTweetId(), e.getMessage(), e);
            
            // Send to dead letter queue
            try {
                kafkaTemplate.send(KafkaConfig.DEAD_LETTER_TOPIC, tweet.getTweetId(), tweet);
                log.warn("⚠️  Sent failed message to dead letter queue");
            } catch (Exception dlqError) {
                log.error("❌ Failed to send to DLQ", dlqError);
            }
            
            acknowledgment.acknowledge();
        }
    }
}

