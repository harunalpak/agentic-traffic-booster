package com.atb.socialengine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Social Engine Service - AI-Powered Reply Generation
 * 
 * This microservice handles:
 * - Consuming discovered tweets from Kafka (published by tweet-scout-service)
 * - Intelligent reply generation using ChatGPT
 * - Short link generation for product URLs
 * - Task management for manual/automated campaigns
 * 
 * Note: Tweet discovery is handled by the separate tweet-scout-service (Node.js)
 */
@SpringBootApplication
public class SocialEngineServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SocialEngineServiceApplication.class, args);
    }
}

