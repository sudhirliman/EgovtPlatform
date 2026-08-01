CREATE TABLE notification_event (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code  VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE notification_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      UUID REFERENCES service_master(id),
    event_id        UUID NOT NULL REFERENCES notification_event(id),
    channel         VARCHAR(10) NOT NULL,
    recipient_type  VARCHAR(20) NOT NULL DEFAULT 'APPLICANT',
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE notification_template (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id       UUID NOT NULL REFERENCES notification_event(id),
    channel        VARCHAR(10) NOT NULL,
    language       VARCHAR(20) NOT NULL DEFAULT 'en',
    subject        VARCHAR(255),
    body_template  TEXT NOT NULL,
    UNIQUE (event_id, channel, language)
);

CREATE TABLE notification_log (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id     UUID REFERENCES application(id),
    event_id           UUID NOT NULL REFERENCES notification_event(id),
    channel            VARCHAR(10) NOT NULL,
    recipient          VARCHAR(255) NOT NULL,
    status             VARCHAR(10) NOT NULL,
    provider_response  TEXT,
    sent_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- seed a starter set of events used by the modules built so far
INSERT INTO notification_event (event_code) VALUES
    ('APPLICATION_SUBMITTED'), ('SCRUTINY_STAGE_CHANGED'), ('SEND_BACK'),
    ('CHALLAN_GENERATED'), ('PAYMENT_RECEIVED'), ('SLA_BREACHED'),
    ('CERTIFICATE_READY'), ('DISPATCHED'), ('TICKET_CREATED'),
    ('TICKET_REPLIED'), ('TICKET_RESOLVED');
