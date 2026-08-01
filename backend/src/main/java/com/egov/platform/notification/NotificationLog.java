package com.egov.platform.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_log")
@Getter
@Setter
@NoArgsConstructor
public class NotificationLog {

    public enum Status { SENT, FAILED }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id")
    private UUID applicationId;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NotificationConfig.Channel channel;

    @Column(nullable = false)
    private String recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status;

    @Column(name = "provider_response", columnDefinition = "TEXT")
    private String providerResponse;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt = Instant.now();
}
