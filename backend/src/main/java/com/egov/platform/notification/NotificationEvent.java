package com.egov.platform.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "notification_event")
@Getter
@Setter
@NoArgsConstructor
public class NotificationEvent {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "event_code", nullable = false, unique = true, length = 60)
    private String eventCode; // e.g. APPLICATION_SUBMITTED, CHALLAN_GENERATED, SLA_BREACHED
}
