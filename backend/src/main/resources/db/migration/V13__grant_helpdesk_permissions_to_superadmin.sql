-- V8 created the HELPDESK_* permissions but never granted them to any role,
-- including SUPERADMIN - this was a bug: SUPERADMIN would get 403 on any
-- helpdesk action despite having global scope, because PermissionEvaluatorService
-- requires the role to actually carry the permission code before the
-- global-scope bypass is even considered.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'SUPERADMIN'
  AND p.code IN ('HELPDESK_VIEW_APPLICATION', 'HELPDESK_REASSIGN', 'HELPDESK_FORCE_ADVANCE', 'HELPDESK_ADD_REMARK');
