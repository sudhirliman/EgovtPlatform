CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE board (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE department (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id    UUID NOT NULL REFERENCES board(id),
    name        VARCHAR(200) NOT NULL,
    code        VARCHAR(50)  NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (board_id, code)
);

CREATE TABLE service_master (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id  UUID NOT NULL REFERENCES department(id),
    name           VARCHAR(200) NOT NULL,
    code           VARCHAR(50)  NOT NULL,
    description    TEXT,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (department_id, code)
);

CREATE INDEX idx_department_board_id ON department(board_id);
CREATE INDEX idx_service_department_id ON service_master(department_id);
