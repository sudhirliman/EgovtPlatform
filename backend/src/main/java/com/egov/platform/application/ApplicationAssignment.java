package com.egov.platform.application;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// The specific person (chosen from the eligible-role dropdown) an application
// is forwarded to at a given stage - see SRS FR-4.6.
@Entity
@Table(name = "application_assignment")
@Getter
@Setter
@NoArgsConstructor
public class ApplicationAssignment {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "stage_id", nullable = false)
    private UUID stageId;

    @Column(name = "assigned_to_user_id", nullable = false)
    private UUID assignedToUserId;

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt = Instant.now();
}
