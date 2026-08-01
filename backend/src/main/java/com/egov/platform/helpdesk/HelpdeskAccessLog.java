package com.egov.platform.helpdesk;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "helpdesk_access_log")
@Getter
@Setter
@NoArgsConstructor
public class HelpdeskAccessLog {

    public enum ActionTaken { VIEW, REASSIGN, FORCE_ADVANCE, REMARK }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "accessed_by_user_id", nullable = false)
    private UUID accessedByUserId;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "reason_text", nullable = false, columnDefinition = "TEXT")
    private String reasonText;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_taken", nullable = false, length = 20)
    private ActionTaken actionTaken;

    @Column(name = "accessed_at", nullable = false)
    private Instant accessedAt = Instant.now();
}
