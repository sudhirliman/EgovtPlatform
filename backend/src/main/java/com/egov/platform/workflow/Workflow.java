package com.egov.platform.workflow;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workflow")
@Getter
@Setter
@NoArgsConstructor
public class Workflow {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL)
    @OrderBy("sequenceOrder ASC")
    private List<WorkflowStage> stages = new ArrayList<>();
}
