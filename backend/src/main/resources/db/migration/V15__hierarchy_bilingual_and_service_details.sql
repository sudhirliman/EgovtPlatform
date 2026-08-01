-- Board: split single `name` into name_english + name_marathi (new migration,
-- since V1 is already applied elsewhere and must never be edited).
ALTER TABLE board RENAME COLUMN name TO name_english;
ALTER TABLE board ADD COLUMN name_marathi VARCHAR(200);

-- Department: same bilingual split.
ALTER TABLE department RENAME COLUMN name TO name_english;
ALTER TABLE department ADD COLUMN name_marathi VARCHAR(200);

-- Service: bilingual names + the full set of fields from the service master
-- design (fee structure, SLA, integrations, and process toggles).
ALTER TABLE service_master RENAME COLUMN name TO name_english;
ALTER TABLE service_master ADD COLUMN name_marathi VARCHAR(200);
ALTER TABLE service_master ADD COLUMN service_category VARCHAR(100);
ALTER TABLE service_master ADD COLUMN service_type VARCHAR(100);
ALTER TABLE service_master ADD COLUMN applicability VARCHAR(20) NOT NULL DEFAULT 'BOTH';
ALTER TABLE service_master ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'ONLINE';
ALTER TABLE service_master ADD COLUMN application_fee NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE service_master ADD COLUMN processing_fee NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE service_master ADD COLUMN security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE service_master ADD COLUMN sla_days INT;
ALTER TABLE service_master ADD COLUMN application_number_format VARCHAR(100);
ALTER TABLE service_master ADD COLUMN certificate_number_format VARCHAR(100);
ALTER TABLE service_master ADD COLUMN working_days_only BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE service_master ADD COLUMN approval_required BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE service_master ADD COLUMN digital_signature_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE service_master ADD COLUMN aaplesarkar_integration_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE service_master ADD COLUMN digilocker_integration_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE service_master ADD COLUMN challan_required BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE service_master ADD COLUMN qr_code_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE service_master ADD COLUMN appeal_allowed BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE service_master ADD COLUMN grievance_allowed BOOLEAN NOT NULL DEFAULT TRUE;
-- Note: service_master.updated_at already exists from V1__hierarchy.sql - not re-added here.
