CREATE TABLE master_form_field (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_key         VARCHAR(100) NOT NULL UNIQUE,
    label             VARCHAR(200) NOT NULL,
    type              VARCHAR(20) NOT NULL,
    validation_rules  JSONB,
    default_required  BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_defined BOOLEAN NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the fields matching AppUser's own columns (name split into first/middle/
-- last, plus mobile/email) - these are the ones most services need on nearly
-- every application form, so they come pre-built and marked system-defined.
INSERT INTO master_form_field (field_key, label, type, default_required, is_system_defined) VALUES
    ('first_name', 'First Name', 'TEXT', TRUE, TRUE),
    ('middle_name', 'Middle Name', 'TEXT', FALSE, TRUE),
    ('last_name', 'Last Name', 'TEXT', TRUE, TRUE),
    ('email', 'Email Address', 'TEXT', FALSE, TRUE),
    ('mobile_number', 'Mobile Number', 'TEXT', TRUE, TRUE);
