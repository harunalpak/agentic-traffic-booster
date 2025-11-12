package com.atb.socialengine.controller;

import com.atb.socialengine.entity.Task;
import com.atb.socialengine.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
     * Get all pending tasks
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Task>> getPendingTasks() {
        List<Task> tasks = taskService.getPendingTasks();
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Get tasks by campaign
     */
    @GetMapping("/campaign/{campaignId}")
    public ResponseEntity<List<Task>> getTasksByCampaign(@PathVariable Long campaignId) {
        List<Task> tasks = taskService.getTasksByCampaign(campaignId);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Approve a task
     */
    @PostMapping("/{taskId}/approve")
    public ResponseEntity<Void> approveTask(@PathVariable Long taskId) {
        taskService.approveTask(taskId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Reject a task
     */
    @PostMapping("/{taskId}/reject")
    public ResponseEntity<Void> rejectTask(@PathVariable Long taskId) {
        taskService.rejectTask(taskId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Update task status
     */
    @PutMapping("/{taskId}/status")
    public ResponseEntity<Void> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestParam String status) {
        taskService.updateTaskStatus(taskId, status);
        return ResponseEntity.ok().build();
    }
}

