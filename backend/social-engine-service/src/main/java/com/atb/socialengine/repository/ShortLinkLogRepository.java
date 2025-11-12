package com.atb.socialengine.repository;

import com.atb.socialengine.entity.ShortLinkLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShortLinkLogRepository extends JpaRepository<ShortLinkLog, Long> {
    
    Optional<ShortLinkLog> findByShortUrl(String shortUrl);
    
    Optional<ShortLinkLog> findByOriginalUrlAndCampaignId(String originalUrl, Long campaignId);
}

