package com.egov.platform.application;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application_stage_history")
@Getter
@Setter
@NoArgsConstructor
public class ApplicationStageHistory {

    public enum Action { ENTERED, FORWARDED, SENT_BACK, APPROVED, REJECTED }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "stage_id", nullable = false)
    private UUID stageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Action action;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "acted_by")
    private UUID actedBy;

    @Column(name = "acted_at", nullable = false)
    private Instant actedAt = Instant.now();

    // SLA fields for this stage visit
    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "is_breached", nullable = false)
    private boolean breached = false;
}
