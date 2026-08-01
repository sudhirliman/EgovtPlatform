package com.egov.platform.ticket;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_message")
@Getter
@Setter
@NoArgsConstructor
public class TicketMessage {

    public enum SenderType { CITIZEN, OFFICER }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Column(name = "sender_user_id", nullable = false)
    private UUID senderUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 10)
    private SenderType senderType;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "attachment_path")
    private String attachmentPath;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
