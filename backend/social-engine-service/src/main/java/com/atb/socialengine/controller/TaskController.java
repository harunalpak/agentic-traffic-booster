package com.atb.socialengine.controller;

import com.atb.socialengine.entity.Task;
import com.atb.socialengine.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * TaskController - REST API for managing reply tasks
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TaskController {
    
    private final TaskService taskService;
    
    /**
     * Get all tasks with optional filters
     */
    @GetMapping
    public ResponseEntity<List<Task>> getTasks(
            @RequestParam(required = false) Long campaignId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String status) {
        
        log.info("Getting tasks - campaignId: {}, productId: {}, mode: {}, status: {}", 
                campaignId, productId, mode, status);
        
        List<Task> tasks;
        
        if (campaignId != null) {
            tasks = taskService.getTasksByCampaign(campaignId);
        } else if (status != null) {
            tasks = taskService.getTasksByStatus(status);
        } else {
            tasks = taskService.getAllTasks();
        }
        
        // Apply additional filters
        if (mode != null) {
            tasks = tasks.stream()
                    .filter(task -> mode.equals(task.getMode()))
                    .toList();
        }
        
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Get task by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Update task status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Task> updateTaskStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        String status = request.get("status");
        log.info("Updating task {} status to {}", id, status);
        
        taskService.updateTaskStatus(id, status);
        
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Approve task (mark as ready to post)
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Task> approveTask(@PathVariable Long id) {
        log.info("Approving task {}", id);
        taskService.approveTask(id);
        
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Reject task
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<Task> rejectTask(@PathVariable Long id) {
        log.info("Rejecting task {}", id);
        taskService.rejectTask(id);
        
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Mark task as posted (completed on Twitter)
     */
    @PutMapping("/{id}/mark-posted")
    public ResponseEntity<Task> markTaskPosted(@PathVariable Long id) {
        log.info("Marking task {} as POSTED", id);
        taskService.updateTaskStatus(id, "POSTED");
        
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Mark task as completed (posted to Twitter) - Legacy endpoint
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<Task> completeTask(@PathVariable Long id) {
        log.info("Completing task {}", id);
        taskService.updateTaskStatus(id, "POSTED");
        
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get task statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTaskStats() {
        Map<String, Object> stats = taskService.getTaskStatistics();
        return ResponseEntity.ok(stats);
    }
}
