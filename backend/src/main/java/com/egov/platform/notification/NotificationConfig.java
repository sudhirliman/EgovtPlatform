package com.egov.platform.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "notification_config")
@Getter
@Setter
@NoArgsConstructor
public class NotificationConfig {

    public enum Channel { EMAIL, SMS }
    public enum RecipientType { APPLICANT, ASSIGNED_OFFICER, SPECIFIC_ROLE }

    @Id
    @GeneratedValue
    private UUID id;

    // null = applies to all services (global default)
    @Column(name = "service_id")
    private UUID serviceId;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Channel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false, length = 20)
    private RecipientType recipientType = RecipientType.APPLICANT;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = true;
}
