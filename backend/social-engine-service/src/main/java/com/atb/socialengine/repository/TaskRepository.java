package com.atb.socialengine.repository;

import com.atb.socialengine.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    List<Task> findByCampaignId(Long campaignId);
    
    List<Task> findByStatus(String status);
    
    List<Task> findByCampaignIdAndStatus(Long campaignId, String status);
    
    boolean existsByTweetId(String tweetId);
    
    // Find tasks by campaign and created after a certain time
    List<Task> findByCampaignIdAndCreatedAtAfter(Long campaignId, LocalDateTime createdAt);
    
    // Count tasks by campaign, status and created after a certain time
    @Query("SELECT COUNT(t) FROM Task t WHERE t.campaignId = :campaignId AND t.status = :status AND t.createdAt > :createdAfter")
    long countByCampaignIdAndStatusAndCreatedAtAfter(
        @Param("campaignId") Long campaignId, 
        @Param("status") String status, 
        @Param("createdAfter") LocalDateTime createdAfter
    );
    
    // Count all tasks by campaign created after a certain time
    @Query("SELECT COUNT(t) FROM Task t WHERE t.campaignId = :campaignId AND t.createdAt > :createdAfter")
    long countByCampaignIdAndCreatedAtAfter(
        @Param("campaignId") Long campaignId, 
        @Param("createdAfter") LocalDateTime createdAfter
    );
}

