package com.egov.platform.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationConfigRepository extends JpaRepository<NotificationConfig, UUID> {
    List<NotificationConfig> findByServiceIdAndEventId(UUID serviceId, UUID eventId);
    List<NotificationConfig> findByServiceIdIsNullAndEventId(UUID eventId);
}
