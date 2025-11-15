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
                .isRisky(suggestion.getIsRisky())
                .riskReason(suggestion.getRiskReason())
                .build();
        
        task = taskRepository.save(task);
        
        log.info("Created task {} for tweet {} (campaign {})", 
                task.getId(), task.getTweetId(), task.getCampaignId());
        
        return task.getId();
    }
    
    /**
     * Get all tasks
     */
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }
    
    /**
     * Get task by ID
     */
    public java.util.Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }
    
    /**
     * Get all pending tasks
     */
    public List<Task> getPendingTasks() {
        return taskRepository.findByStatus("PENDING");
    }
    
    /**
     * Get tasks by status
     */
    public List<Task> getTasksByStatus(String status) {
        return taskRepository.findByStatus(status);
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
    
    /**
     * Get task statistics
     */
    public java.util.Map<String, Object> getTaskStatistics() {
        List<Task> allTasks = taskRepository.findAll();
        
        long pending = allTasks.stream().filter(t -> "PENDING".equals(t.getStatus())).count();
        long approved = allTasks.stream().filter(t -> "APPROVED".equals(t.getStatus())).count();
        long rejected = allTasks.stream().filter(t -> "REJECTED".equals(t.getStatus())).count();
        long posted = allTasks.stream().filter(t -> "POSTED".equals(t.getStatus())).count();
        long risky = allTasks.stream().filter(t -> Boolean.TRUE.equals(t.getIsRisky())).count();
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("total", allTasks.size());
        stats.put("pending", pending);
        stats.put("approved", approved);
        stats.put("rejected", rejected);
        stats.put("posted", posted);
        stats.put("risky", risky);
        
        return stats;
    }
    
    /**
     * Get campaign statistics for last 24 hours
     */
    public java.util.Map<String, Object> getCampaignStatistics(Long campaignId) {
        java.time.LocalDateTime twentyFourHoursAgo = java.time.LocalDateTime.now().minusHours(24);
        
        long totalFound = taskRepository.countByCampaignIdAndCreatedAtAfter(campaignId, twentyFourHoursAgo);
        long posted = taskRepository.countByCampaignIdAndStatusAndCreatedAtAfter(campaignId, "POSTED", twentyFourHoursAgo);
        long rejected = taskRepository.countByCampaignIdAndStatusAndCreatedAtAfter(campaignId, "REJECTED", twentyFourHoursAgo);
        long pending = taskRepository.countByCampaignIdAndStatusAndCreatedAtAfter(campaignId, "PENDING", twentyFourHoursAgo);
        long approved = taskRepository.countByCampaignIdAndStatusAndCreatedAtAfter(campaignId, "APPROVED", twentyFourHoursAgo);
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("campaignId", campaignId);
        stats.put("period", "24h");
        stats.put("totalFound", totalFound);
        stats.put("posted", posted);
        stats.put("rejected", rejected);
        stats.put("pending", pending);
        stats.put("approved", approved);
        
        log.info("Campaign {} statistics (24h): total={}, posted={}, rejected={}, pending={}, approved={}", 
                campaignId, totalFound, posted, rejected, pending, approved);
        
        return stats;
    }
}

