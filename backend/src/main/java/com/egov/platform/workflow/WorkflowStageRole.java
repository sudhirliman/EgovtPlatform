package com.egov.platform.workflow;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

// Which role(s) are eligible to act at a stage. Multiple users may hold that
// role - the officer/UI then picks a specific person (see ApplicationAssignment).
@Entity
@Table(name = "workflow_stage_role")
@Getter
@Setter
@NoArgsConstructor
public class WorkflowStageRole {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "stage_id", nullable = false)
    private UUID stageId;

    @Column(name = "role_id", nullable = false)
    private UUID roleId;
}
