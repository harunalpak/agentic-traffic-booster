package com.atb.socialengine.consumer;

import com.atb.socialengine.config.KafkaConfig;
import com.atb.socialengine.model.ReplySuggestion;
import com.atb.socialengine.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * TaskConsumer - Persists generated replies as tasks for review/automation
 * 
 * Flow:
 * 1. Consume reply suggestions from generated_replies topic
 * 2. Save to PostgreSQL as Task entity
 * 3. Tasks can be reviewed manually or processed automatically
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class TaskConsumer {
    
    private final TaskService taskService;
    
    @KafkaListener(
        topics = KafkaConfig.GENERATED_REPLIES_TOPIC,
        groupId = "${spring.kafka.consumer.group-id}-task",
        containerFactory = "replySuggestionKafkaListenerContainerFactory"
    )
    public void processReplySuggestion(ReplySuggestion suggestion, Acknowledgment acknowledgment) {
        try {
            log.info("========================================");
            log.info("TaskConsumer: Processing reply for tweet {}", suggestion.getTweetId());
            log.info("Reply text: {}", suggestion.getReplyText());
            log.info("========================================");
            
            // Save to database
            Long taskId = taskService.createTask(suggestion);
            
            log.info("========================================");
            log.info("TaskConsumer: Saved reply as task {} in database", taskId);
            log.info("Status: PENDING (awaiting review or automation)");
            log.info("========================================");
            
            // Acknowledge message
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("Error processing reply suggestion for tweet {}: {}", 
                     suggestion.getTweetId(), e.getMessage(), e);
            acknowledgment.acknowledge();
        }
    }
}

