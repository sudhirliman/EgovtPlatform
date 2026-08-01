-- Theme & branding
CREATE TABLE theme (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    board_id   UUID REFERENCES board(id),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE theme_property (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id        UUID NOT NULL REFERENCES theme(id) ON DELETE CASCADE,
    property_key    VARCHAR(60) NOT NULL,
    property_value  VARCHAR(200) NOT NULL,
    UNIQUE (theme_id, property_key)
);

CREATE TABLE board_branding (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id     UUID NOT NULL UNIQUE REFERENCES board(id),
    logo_url     VARCHAR(500),
    favicon_url  VARCHAR(500),
    footer_text  VARCHAR(500)
);

-- Certificate & notesheet
CREATE TABLE certificate_template (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id     UUID NOT NULL REFERENCES service_master(id),
    template_html  TEXT NOT NULL
);

CREATE TABLE notesheet (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES application(id),
    file_path       VARCHAR(500) NOT NULL,
    checksum        VARCHAR(64) NOT NULL,
    version         INT NOT NULL DEFAULT 1,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notesheet_access_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notesheet_id  UUID NOT NULL REFERENCES notesheet(id),
    accessed_by   UUID NOT NULL REFERENCES app_user(id),
    accessed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support tickets
CREATE TABLE ticket_category (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name            VARCHAR(100) NOT NULL,
    department_id            UUID REFERENCES department(id),
    default_assigned_role_id UUID REFERENCES role(id),
    sla_hours                INT
);

CREATE TABLE support_ticket (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no             VARCHAR(40) NOT NULL UNIQUE,
    application_id        UUID REFERENCES application(id),
    raised_by_user_id     UUID NOT NULL REFERENCES app_user(id),
    category_id           UUID NOT NULL REFERENCES ticket_category(id),
    subject               VARCHAR(200) NOT NULL,
    description           TEXT,
    priority              VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    status                VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_to_user_id   UUID REFERENCES app_user(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at           TIMESTAMPTZ
);

CREATE TABLE ticket_message (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id        UUID NOT NULL REFERENCES support_ticket(id) ON DELETE CASCADE,
    sender_user_id   UUID NOT NULL REFERENCES app_user(id),
    sender_type      VARCHAR(10) NOT NULL,
    message          TEXT,
    attachment_path  VARCHAR(500),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket_status_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL REFERENCES support_ticket(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL,
    changed_by  UUID REFERENCES app_user(id),
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpdesk
CREATE TABLE helpdesk_access_log (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_by_user_id  UUID NOT NULL REFERENCES app_user(id),
    application_id       UUID NOT NULL REFERENCES application(id),
    reason_text          TEXT NOT NULL,
    action_taken         VARCHAR(20) NOT NULL,
    accessed_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- baseline helpdesk permissions, referenced by HelpdeskService
INSERT INTO permission (code, description) VALUES
    ('HELPDESK_VIEW_APPLICATION', 'View any application across boards/departments/services'),
    ('HELPDESK_REASSIGN', 'Reassign a stuck application to a different officer'),
    ('HELPDESK_FORCE_ADVANCE', 'Force-advance a stuck application to its next stage'),
    ('HELPDESK_ADD_REMARK', 'Add an internal remark to any application');
