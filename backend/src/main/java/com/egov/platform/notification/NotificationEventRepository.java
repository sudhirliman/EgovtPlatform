package com.egov.platform.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NotificationEventRepository extends JpaRepository<NotificationEvent, UUID> {
    Optional<NotificationEvent> findByEventCode(String eventCode);
}
