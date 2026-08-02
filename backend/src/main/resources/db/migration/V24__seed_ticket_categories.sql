-- Default ticket categories for the helpdesk
INSERT INTO ticket_category (id, category_name, sla_hours) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'General Enquiry',       48),
    ('a1000000-0000-0000-0000-000000000002', 'Application Status',    24),
    ('a1000000-0000-0000-0000-000000000003', 'Document Issue',        24),
    ('a1000000-0000-0000-0000-000000000004', 'Payment Issue',         12),
    ('a1000000-0000-0000-0000-000000000005', 'Technical Support',     8),
    ('a1000000-0000-0000-0000-000000000006', 'Grievance',             72);
