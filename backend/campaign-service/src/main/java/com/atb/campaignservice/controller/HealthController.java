package com.atb.campaignservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * GET /api/health - Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "campaign-service");
        health.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(health);
    }

    /**
     * GET /api/status - Alternative status endpoint
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> status() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "running");
        status.put("service", "campaign-service");
        return ResponseEntity.ok(status);
    }
}

