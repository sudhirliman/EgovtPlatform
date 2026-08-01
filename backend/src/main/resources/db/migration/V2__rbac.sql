CREATE TABLE role (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(100) NOT NULL UNIQUE,
    has_global_scope  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permission (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code  VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE role_permission (
    role_id        UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id  UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE app_user (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(200) NOT NULL,
    mobile       VARCHAR(15)  NOT NULL UNIQUE,
    email        VARCHAR(200),
    password_hash VARCHAR(255),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_role (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role_id        UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    board_id       UUID REFERENCES board(id),
    department_id  UUID REFERENCES department(id),
    service_id     UUID REFERENCES service_master(id),
    UNIQUE (user_id, role_id, board_id, department_id, service_id)
);

CREATE INDEX idx_user_role_user_id ON user_role(user_id);

-- seed baseline permissions and superadmin role
INSERT INTO permission (code, description) VALUES
    ('BOARD_MANAGE', 'Create/edit/deactivate boards'),
    ('DEPARTMENT_MANAGE', 'Create/edit/deactivate departments'),
    ('SERVICE_MANAGE', 'Create/edit/deactivate services'),
    ('ROLE_MANAGE', 'Create/edit roles and permissions'),
    ('USER_MANAGE', 'Create/edit users and role assignments');

INSERT INTO role (name, has_global_scope) VALUES ('SUPERADMIN', TRUE);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p WHERE r.name = 'SUPERADMIN';
