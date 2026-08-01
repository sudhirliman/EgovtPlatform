CREATE TABLE application (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_no      VARCHAR(40) UNIQUE,
    service_id          UUID NOT NULL REFERENCES service_master(id),
    applicant_user_id   UUID NOT NULL REFERENCES app_user(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    form_data           JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at        TIMESTAMPTZ,
    last_saved_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE application_document (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    document_config_id  UUID,
    document_type       VARCHAR(20) NOT NULL,
    custom_label        VARCHAR(200),
    file_name           VARCHAR(255) NOT NULL,
    file_path           VARCHAR(500) NOT NULL,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE application_workflow_instance (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id    UUID NOT NULL UNIQUE REFERENCES application(id) ON DELETE CASCADE,
    current_stage_id  UUID NOT NULL REFERENCES workflow_stage(id),
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE application_stage_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    stage_id        UUID NOT NULL REFERENCES workflow_stage(id),
    action          VARCHAR(20) NOT NULL,
    remarks         TEXT,
    acted_by        UUID REFERENCES app_user(id),
    acted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at          TIMESTAMPTZ,
    is_breached     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE application_assignment (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id        UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    stage_id              UUID NOT NULL REFERENCES workflow_stage(id),
    assigned_to_user_id   UUID NOT NULL REFERENCES app_user(id),
    assigned_by           UUID REFERENCES app_user(id),
    assigned_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_application_service_id ON application(service_id);
CREATE INDEX idx_application_applicant ON application(applicant_user_id, status);
CREATE INDEX idx_app_doc_application_id ON application_document(application_id);
CREATE INDEX idx_stage_history_application_id ON application_stage_history(application_id);
CREATE INDEX idx_stage_history_due_at ON application_stage_history(due_at) WHERE is_breached = FALSE;
CREATE INDEX idx_assignment_application_id ON application_assignment(application_id);
