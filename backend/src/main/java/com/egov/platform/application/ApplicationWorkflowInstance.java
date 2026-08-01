package com.egov.platform.application;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "application_workflow_instance")
@Getter
@Setter
@NoArgsConstructor
public class ApplicationWorkflowInstance {

    public enum Status { ACTIVE, COMPLETED }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false, unique = true)
    private UUID applicationId;

    @Column(name = "current_stage_id", nullable = false)
    private UUID currentStageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;
}
