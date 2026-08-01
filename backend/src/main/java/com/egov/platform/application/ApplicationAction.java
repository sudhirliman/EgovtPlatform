package com.egov.platform.application;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application_action")
@Getter @Setter @NoArgsConstructor
public class ApplicationAction {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "from_status", length = 60)
    private String fromStatus;

    @Column(name = "to_status", nullable = false, length = 60)
    private String toStatus;

    @Column(name = "action_type", nullable = false, length = 60)
    private String actionType;

    @Column(name = "acted_by", nullable = false)
    private UUID actedBy;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "acted_at", nullable = false, updatable = false)
    private Instant actedAt = Instant.now();

    public ApplicationAction(UUID applicationId, String fromStatus, String toStatus,
                             String actionType, UUID actedBy, UUID assigneeId, String remarks) {
        this.applicationId = applicationId;
        this.fromStatus    = fromStatus;
        this.toStatus      = toStatus;
        this.actionType    = actionType;
        this.actedBy       = actedBy;
        this.assigneeId    = assigneeId;
        this.remarks       = remarks;
    }
}
