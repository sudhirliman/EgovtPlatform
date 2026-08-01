package com.egov.platform.ticket;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "support_ticket")
@Getter
@Setter
@NoArgsConstructor
public class SupportTicket {

    public enum Status { OPEN, IN_PROGRESS, RESOLVED, REOPENED, CLOSED }
    public enum Priority { LOW, MEDIUM, HIGH }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "ticket_no", nullable = false, unique = true, length = 40)
    private String ticketNo;

    // nullable - a ticket may be a general query, not tied to one application
    @Column(name = "application_id")
    private UUID applicationId;

    @Column(name = "raised_by_user_id", nullable = false)
    private UUID raisedByUserId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.OPEN;

    @Column(name = "assigned_to_user_id")
    private UUID assignedToUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
