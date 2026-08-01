package com.egov.platform.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "notification_template")
@Getter
@Setter
@NoArgsConstructor
public class NotificationTemplate {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NotificationConfig.Channel channel;

    @Column(length = 20)
    private String language = "en";

    private String subject; // email only

    // supports {{applicant_name}}, {{application_no}}, {{stage_name}}, {{amount}}, etc.
    @Column(name = "body_template", nullable = false, columnDefinition = "TEXT")
    private String bodyTemplate;
}
