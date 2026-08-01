-- V20: CFC Multi-Role Workflow Extension
-- Adds: new statuses, assignment tracking, action audit trail, document verification

-- 1. Widen status column to hold longest value (REVERTED_BY_ASSISTANT_SENIOR_CLERK = 36 chars)
ALTER TABLE application ALTER COLUMN status TYPE VARCHAR(60);

-- 2. Assignment tracking columns on application
ALTER TABLE application
    ADD COLUMN IF NOT EXISTS assigned_io_id         UUID REFERENCES app_user(id),
    ADD COLUMN IF NOT EXISTS assigned_em_id         UUID REFERENCES app_user(id),
    ADD COLUMN IF NOT EXISTS assigned_clerk_id      UUID REFERENCES app_user(id),
    ADD COLUMN IF NOT EXISTS current_assignee_id    UUID REFERENCES app_user(id),
    ADD COLUMN IF NOT EXISTS certificate_path       VARCHAR(500),
    ADD COLUMN IF NOT EXISTS certificate_uploaded_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_app_assigned_em    ON application(assigned_em_id);
CREATE INDEX IF NOT EXISTS idx_app_assigned_clerk ON application(assigned_clerk_id);
CREATE INDEX IF NOT EXISTS idx_app_current_assign ON application(current_assignee_id);

-- 3. Status-machine audit trail (separate from workflow-stage-based history)
CREATE TABLE IF NOT EXISTS application_action (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES application(id),
    from_status    VARCHAR(60),
    to_status      VARCHAR(60) NOT NULL,
    action_type    VARCHAR(60) NOT NULL,
    acted_by       UUID NOT NULL REFERENCES app_user(id),
    assignee_id    UUID REFERENCES app_user(id),
    remarks        TEXT,
    acted_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_action_app  ON application_action(application_id);
CREATE INDEX IF NOT EXISTS idx_app_action_time ON application_action(acted_at DESC);

-- 4. Per-document verification at each stage
CREATE TABLE IF NOT EXISTS document_verification (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id     UUID NOT NULL REFERENCES application(id),
    document_id        UUID NOT NULL REFERENCES application_document(id),
    verification_stage VARCHAR(20) NOT NULL,   -- 'CLERK' or 'EM'
    action             VARCHAR(20) NOT NULL,   -- 'ACCEPTED' or 'REJECTED'
    verified_by        UUID NOT NULL REFERENCES app_user(id),
    remark             TEXT NOT NULL,
    verified_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, verification_stage)
);

CREATE INDEX IF NOT EXISTS idx_doc_verif_app   ON document_verification(application_id);
CREATE INDEX IF NOT EXISTS idx_doc_verif_stage ON document_verification(application_id, verification_stage);

-- 5. Seed IO, EM, CLERK roles
INSERT INTO role (id, name, has_global_scope)
VALUES
    (gen_random_uuid(), 'IO',    FALSE),
    (gen_random_uuid(), 'EM',    FALSE),
    (gen_random_uuid(), 'CLERK', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 6. Seed CFC-specific permissions
INSERT INTO permission (id, code, description)
VALUES
    (gen_random_uuid(), 'CFC_IO_ACT',    'Initial Officer: outward or revert submitted applications'),
    (gen_random_uuid(), 'CFC_EM_ACT',    'Estate Manager: forward, approve, generate challan, finalize, upload, dispatch'),
    (gen_random_uuid(), 'CFC_CLERK_ACT', 'Clerk: verify documents, approve or revert forwarded applications')
ON CONFLICT (code) DO NOTHING;

-- 7. Grant CFC permissions to their respective roles
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.name = 'IO' AND p.code = 'CFC_IO_ACT'
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.name = 'EM' AND p.code = 'CFC_EM_ACT'
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.name = 'CLERK' AND p.code = 'CFC_CLERK_ACT'
ON CONFLICT DO NOTHING;

-- 8. Grant all CFC permissions to SUPERADMIN as well
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.name = 'SUPERADMIN'
  AND p.code IN ('CFC_IO_ACT', 'CFC_EM_ACT', 'CFC_CLERK_ACT')
ON CONFLICT DO NOTHING;
