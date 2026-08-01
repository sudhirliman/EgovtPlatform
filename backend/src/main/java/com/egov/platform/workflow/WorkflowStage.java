package com.egov.platform.workflow;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "workflow_stage")
@Getter
@Setter
@NoArgsConstructor
public class WorkflowStage {

    public enum StageType {
        SCRUTINY, PAYMENT_CHECK, CERTIFICATE_GENERATION, NOTESHEET_GENERATION, DISPATCH
    }

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @Column(name = "sequence_order", nullable = false)
    private int sequenceOrder;

    @Column(name = "stage_name", nullable = false, length = 200)
    private String stageName;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage_type", nullable = false, length = 30)
    private StageType stageType;

    @Column(name = "sla_hours")
    private Integer slaHours;

    @Column(name = "escalation_role_id")
    private UUID escalationRoleId;
}
