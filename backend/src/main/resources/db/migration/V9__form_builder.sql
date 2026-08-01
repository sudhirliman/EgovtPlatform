CREATE TABLE form_template (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id  UUID NOT NULL REFERENCES service_master(id),
    version     INT NOT NULL DEFAULT 1,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE form_field (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_template_id   UUID NOT NULL REFERENCES form_template(id) ON DELETE CASCADE,
    field_key          VARCHAR(100) NOT NULL,
    label              VARCHAR(200) NOT NULL,
    type               VARCHAR(20) NOT NULL,
    is_required        BOOLEAN NOT NULL DEFAULT FALSE,
    display_order      INT NOT NULL DEFAULT 0,
    validation_rules   JSONB,
    UNIQUE (form_template_id, field_key)
);

CREATE TABLE service_document_config (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id          UUID NOT NULL REFERENCES service_master(id),
    document_name       VARCHAR(200) NOT NULL,
    document_code       VARCHAR(60),
    is_mandatory        BOOLEAN NOT NULL DEFAULT TRUE,
    allowed_file_types  VARCHAR(100),
    max_file_size_mb    INT,
    max_count           INT NOT NULL DEFAULT 1,
    display_order       INT NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_form_template_service_id ON form_template(service_id);
CREATE INDEX idx_form_field_template_id ON form_field(form_template_id);
CREATE INDEX idx_service_doc_config_service_id ON service_document_config(service_id);

-- Now that application_document exists (V5) and this table exists, wire the FK.
ALTER TABLE application_document
    ADD CONSTRAINT fk_app_doc_config
    FOREIGN KEY (document_config_id) REFERENCES service_document_config(id);
