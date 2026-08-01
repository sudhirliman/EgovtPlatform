CREATE TABLE external_payment_reference (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    source          VARCHAR(40) NOT NULL DEFAULT 'APLESARKAR',
    transaction_id  VARCHAR(100) NOT NULL,
    amount          NUMERIC(12,2),
    status          VARCHAR(20) NOT NULL
);

CREATE TABLE challan (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id        UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    challan_no            VARCHAR(40) NOT NULL UNIQUE,
    amount                NUMERIC(12,2) NOT NULL,
    purpose               VARCHAR(200),
    generated_by_user_id  UUID NOT NULL REFERENCES app_user(id),
    generated_at_stage_id UUID REFERENCES workflow_stage(id),
    parent_challan_id     UUID REFERENCES challan(id),
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_gateway_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_code    VARCHAR(30) NOT NULL,
    environment     VARCHAR(20) NOT NULL,
    client_id       VARCHAR(255),
    client_secret   VARCHAR(255),
    webhook_secret  VARCHAR(255),
    board_id        UUID REFERENCES board(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE payment_transaction (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_id           UUID NOT NULL REFERENCES challan(id) ON DELETE CASCADE,
    payment_mode         VARCHAR(10) NOT NULL,
    gateway_code         VARCHAR(30),
    gateway_order_id     VARCHAR(100),
    gateway_txn_id       VARCHAR(100),
    bank_name            VARCHAR(200),
    offline_receipt_no   VARCHAR(100),
    deposit_date         DATE,
    proof_document_path  VARCHAR(500),
    verified_by_user_id  UUID REFERENCES app_user(id),
    verified_at          TIMESTAMPTZ,
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_external_payment_application_id ON external_payment_reference(application_id);
CREATE INDEX idx_challan_application_id ON challan(application_id);
CREATE INDEX idx_payment_txn_challan_id ON payment_transaction(challan_id);
CREATE UNIQUE INDEX idx_payment_txn_gateway_order_id ON payment_transaction(gateway_order_id) WHERE gateway_order_id IS NOT NULL;
