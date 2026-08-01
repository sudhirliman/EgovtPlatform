-- Seeds one superadmin login so you can authenticate immediately after first boot.
-- Username: superadmin   Mobile: 9999999999   Password: changeme123
-- (login accepts either the username or the mobile number)
-- CHANGE THIS PASSWORD (or delete this user and create a real one via the UI/API)
-- before this ever runs against anything beyond your own local machine.
INSERT INTO app_user (name, username, mobile, password_hash, is_active)
VALUES ('Super Admin', 'superadmin', '9999999999', '$2b$10$fa7Ki5cnlJ46k0BkzvcXvODhNqELDq4lNfZYaAuL.34ZhLv/XfU/u', TRUE);

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM app_user u
CROSS JOIN role r
WHERE u.mobile = '9999999999' AND r.name = 'SUPERADMIN';
