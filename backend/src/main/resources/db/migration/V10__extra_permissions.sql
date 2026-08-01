INSERT INTO permission (code, description) VALUES
    ('WORKFLOW_MANAGE', 'Create/edit workflows and stages'),
    ('WORKFLOW_ACT', 'Forward or send back an application at a workflow stage'),
    ('CHALLAN_GENERATE', 'Generate a challan against an application'),
    ('PAYMENT_VERIFY_OFFLINE', 'Verify an offline (bank/treasury) payment'),
    ('TICKET_MANAGE', 'Respond to and resolve support tickets');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'SUPERADMIN'
  AND p.code IN ('WORKFLOW_MANAGE','WORKFLOW_ACT','CHALLAN_GENERATE','PAYMENT_VERIFY_OFFLINE','TICKET_MANAGE');
