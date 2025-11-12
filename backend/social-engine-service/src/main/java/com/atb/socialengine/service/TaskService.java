package com.atb.socialengine.service;

import com.atb.socialengine.entity.Task;
import com.atb.socialengine.model.ReplySuggestion;
import com.atb.socialengine.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * TaskService - Manages reply tasks for manual review or automation
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TaskService {
    
    private final TaskRepository taskRepository;
    
    /**
     * Create a new task from a reply suggestion
     */
    @Transactional
    public Long createTask(ReplySuggestion suggestion) {
        // Check if task already exists for this tweet
        if (taskRepository.existsByTweetId(suggestion.getTweetId())) {
            log.info("Task already exists for tweet {}, skipping", suggestion.getTweetId());
            return null;
        }
        
        Task task = Task.builder()
                .tweetId(suggestion.getTweetId())
                .campaignId(suggestion.getCampaignId())
                .replyText(suggestion.getReplyText())
                .mode(suggestion.getMode())
                .status("PENDING")
                .tweetAuthor(suggestion.getTweetAuthor())
                .tweetText(suggestion.getTweetText())
                .tweetUrl(suggestion.getTweetUrl())
                .confidenceScore(suggestion.getConfidence())
                .shortLink(suggestion.getShortLink())
                .build();
        
        task = taskRepository.save(task);
        
        log.info("Created task {} for tweet {} (campaign {})", 
                task.getId(), task.getTweetId(), task.getCampaignId());
        
        return task.getId();
    }
    
    /**
     * Get all pending tasks
     */
    public List<Task> getPendingTasks() {
        return taskRepository.findByStatus("PENDING");
    }
    
    /**
     * Get tasks by campaign
     */
    public List<Task> getTasksByCampaign(Long campaignId) {
        return taskRepository.findByCampaignId(campaignId);
    }
    
    /**
     * Update task status
     */
    @Transactional
    public void updateTaskStatus(Long taskId, String status) {
        taskRepository.findById(taskId).ifPresent(task -> {
            task.setStatus(status);
            taskRepository.save(task);
            log.info("Updated task {} status to {}", taskId, status);
        });
    }
    
    /**
     * Approve a task for posting
     */
    @Transactional
    public void approveTask(Long taskId) {
        updateTaskStatus(taskId, "APPROVED");
    }
    
    /**
     * Reject a task
     */
    @Transactional
    public void rejectTask(Long taskId) {
        updateTaskStatus(taskId, "REJECTED");
    }
}

