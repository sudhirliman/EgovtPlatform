-- Without this, every NotificationService.trigger(...) call wired into the
-- workflow/payment/ticket/SLA modules would silently no-op, because
-- NotificationConfig/NotificationTemplate rows never existed for any event -
-- only the NotificationEvent codes themselves were seeded in V7. This
-- migration gives every event a sensible default (both channels enabled,
-- global scope, simple English template) so the platform is usable
-- out of the box; override per-service via the Notifications config screens
-- as needed.

-- Enable both channels, globally, for every seeded event.
INSERT INTO notification_config (service_id, event_id, channel, recipient_type, is_enabled)
SELECT NULL, e.id, 'SMS', 'APPLICANT', TRUE FROM notification_event e;

INSERT INTO notification_config (service_id, event_id, channel, recipient_type, is_enabled)
SELECT NULL, e.id, 'EMAIL', 'APPLICANT', TRUE FROM notification_event e;

-- SMS templates (short, no subject).
INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Your application {{application_no}} has been submitted. Current stage: {{stage_name}}.'
FROM notification_event WHERE event_code = 'APPLICATION_SUBMITTED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Application {{application_no}} has moved to stage: {{stage_name}}.'
FROM notification_event WHERE event_code = 'SCRUTINY_STAGE_CHANGED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Application {{application_no}} sent back for re-scrutiny at stage {{stage_name}}. Remarks: {{remarks}}.'
FROM notification_event WHERE event_code = 'SEND_BACK';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Challan {{challan_no}} of amount Rs.{{amount}} generated. Purpose: {{purpose}}. Please pay to proceed.'
FROM notification_event WHERE event_code = 'CHALLAN_GENERATED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Payment received for challan {{challan_no}}, amount Rs.{{amount}}. Thank you.'
FROM notification_event WHERE event_code = 'PAYMENT_RECEIVED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Your application {{application_no}} has exceeded its expected processing time. We are looking into it.'
FROM notification_event WHERE event_code = 'SLA_BREACHED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Certificate for application {{application_no}} is ready.'
FROM notification_event WHERE event_code = 'CERTIFICATE_READY';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Your application {{application_no}} has been dispatched.'
FROM notification_event WHERE event_code = 'DISPATCHED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Your support ticket {{ticket_no}} ("{{subject}}") has been created.'
FROM notification_event WHERE event_code = 'TICKET_CREATED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'You have a new reply on support ticket {{ticket_no}}.'
FROM notification_event WHERE event_code = 'TICKET_REPLIED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'SMS', 'en', NULL, 'Your support ticket {{ticket_no}} has been resolved.'
FROM notification_event WHERE event_code = 'TICKET_RESOLVED';

-- EMAIL templates (with subject).
INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Application {{application_no}} submitted',
       'Your application {{application_no}} has been submitted successfully. Current stage: {{stage_name}}.'
FROM notification_event WHERE event_code = 'APPLICATION_SUBMITTED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Application {{application_no}} - stage updated',
       'Your application {{application_no}} has moved to stage: {{stage_name}}.'
FROM notification_event WHERE event_code = 'SCRUTINY_STAGE_CHANGED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Application {{application_no}} sent back for correction',
       'Your application {{application_no}} has been sent back for re-scrutiny at stage {{stage_name}}. Remarks: {{remarks}}.'
FROM notification_event WHERE event_code = 'SEND_BACK';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Challan {{challan_no}} generated',
       'A challan ({{challan_no}}) of amount Rs.{{amount}} has been generated for your application. Purpose: {{purpose}}. Please complete payment to proceed.'
FROM notification_event WHERE event_code = 'CHALLAN_GENERATED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Payment received - challan {{challan_no}}',
       'We have received your payment of Rs.{{amount}} for challan {{challan_no}}. Thank you.'
FROM notification_event WHERE event_code = 'PAYMENT_RECEIVED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Application {{application_no}} - delay notice',
       'Your application {{application_no}} has exceeded its expected processing time (SLA). We are looking into it and apologise for the delay.'
FROM notification_event WHERE event_code = 'SLA_BREACHED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Certificate ready - application {{application_no}}',
       'The certificate for your application {{application_no}} is ready.'
FROM notification_event WHERE event_code = 'CERTIFICATE_READY';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Application {{application_no}} dispatched',
       'Your application {{application_no}} has been dispatched.'
FROM notification_event WHERE event_code = 'DISPATCHED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Support ticket {{ticket_no}} created',
       'Your support ticket {{ticket_no}} ("{{subject}}") has been created. We will get back to you shortly.'
FROM notification_event WHERE event_code = 'TICKET_CREATED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'New reply on ticket {{ticket_no}}',
       'You have a new reply on your support ticket {{ticket_no}}. Please log in to view it.'
FROM notification_event WHERE event_code = 'TICKET_REPLIED';

INSERT INTO notification_template (event_id, channel, language, subject, body_template)
SELECT id, 'EMAIL', 'en', 'Ticket {{ticket_no}} resolved',
       'Your support ticket {{ticket_no}} has been marked resolved. Let us know if you need further help.'
FROM notification_event WHERE event_code = 'TICKET_RESOLVED';
