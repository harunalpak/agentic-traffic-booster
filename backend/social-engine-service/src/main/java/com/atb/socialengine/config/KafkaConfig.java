package com.atb.socialengine.config;

import com.atb.socialengine.model.ReplySuggestion;
import com.atb.socialengine.model.Tweet;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka Configuration for Social Engine Service
 * 
 * Topics:
 * - new_tweets: Incoming candidate tweets from TweetScout
 * - generated_replies: AI-generated replies from ReplyGenerator
 * - dead_letter: Failed messages for monitoring
 */
@Configuration
public class KafkaConfig {
    
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;
    
    @Value("${spring.kafka.consumer.group-id}")
    private String consumerGroupId;
    
    // Topic Names
    public static final String NEW_TWEETS_TOPIC = "new_tweets";
    public static final String GENERATED_REPLIES_TOPIC = "generated_replies";
    public static final String DEAD_LETTER_TOPIC = "dead_letter";
    
    // ============ Topic Creation ============
    
    @Bean
    public NewTopic newTweetsTopic() {
        return TopicBuilder.name(NEW_TWEETS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic generatedRepliesTopic() {
        return TopicBuilder.name(GENERATED_REPLIES_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic deadLetterTopic() {
        return TopicBuilder.name(DEAD_LETTER_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }
    
    // ============ Producer Configuration ============
    
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        return new DefaultKafkaProducerFactory<>(config);
    }
    
    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
    
    // ============ Consumer Configuration - Tweet ============
    
    @Bean
    public ConsumerFactory<String, Tweet> tweetConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, consumerGroupId);
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class.getName());
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, Tweet.class.getName());
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Tweet> tweetKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Tweet> factory = 
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(tweetConsumerFactory());
        factory.setConcurrency(3);
        factory.getContainerProperties().setAckMode(org.springframework.kafka.listener.ContainerProperties.AckMode.MANUAL);
        return factory;
    }
    
    // ============ Consumer Configuration - ReplySuggestion ============
    
    @Bean
    public ConsumerFactory<String, ReplySuggestion> replySuggestionConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, consumerGroupId + "-reply");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class.getName());
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, ReplySuggestion.class.getName());
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        return new DefaultKafkaConsumerFactory<>(config);
    }
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ReplySuggestion> replySuggestionKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ReplySuggestion> factory = 
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(replySuggestionConsumerFactory());
        factory.setConcurrency(2);
        factory.getContainerProperties().setAckMode(org.springframework.kafka.listener.ContainerProperties.AckMode.MANUAL);
        return factory;
    }
}

