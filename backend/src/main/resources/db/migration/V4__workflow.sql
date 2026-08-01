CREATE TABLE workflow (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id   UUID NOT NULL REFERENCES service_master(id),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE workflow_stage (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id        UUID NOT NULL REFERENCES workflow(id) ON DELETE CASCADE,
    sequence_order     INT NOT NULL,
    stage_name         VARCHAR(200) NOT NULL,
    stage_type         VARCHAR(30) NOT NULL,
    sla_hours          INT,
    escalation_role_id UUID REFERENCES role(id),
    UNIQUE (workflow_id, sequence_order)
);

CREATE TABLE workflow_stage_role (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id  UUID NOT NULL REFERENCES workflow_stage(id) ON DELETE CASCADE,
    role_id   UUID NOT NULL REFERENCES role(id),
    UNIQUE (stage_id, role_id)
);

CREATE INDEX idx_workflow_service_id ON workflow(service_id);
CREATE INDEX idx_workflow_stage_workflow_id ON workflow_stage(workflow_id);
