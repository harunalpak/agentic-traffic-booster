package com.atb.socialengine.repository;

import com.atb.socialengine.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    List<Task> findByCampaignId(Long campaignId);
    
    List<Task> findByStatus(String status);
    
    List<Task> findByCampaignIdAndStatus(Long campaignId, String status);
    
    boolean existsByTweetId(String tweetId);
}

