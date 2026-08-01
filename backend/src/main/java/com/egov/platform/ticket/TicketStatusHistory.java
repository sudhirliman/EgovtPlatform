package com.egov.platform.ticket;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_status_history")
@Getter
@Setter
@NoArgsConstructor
public class TicketStatusHistory {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupportTicket.Status status;

    @Column(name = "changed_by")
    private UUID changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt = Instant.now();
}
