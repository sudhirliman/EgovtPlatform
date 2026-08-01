package com.egov.platform.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ApplicationStageHistoryRepository extends JpaRepository<ApplicationStageHistory, UUID> {
    List<ApplicationStageHistory> findByApplicationIdOrderByActedAtAsc(UUID applicationId);
    List<ApplicationStageHistory> findByDueAtBeforeAndBreachedFalse(Instant now);
}
