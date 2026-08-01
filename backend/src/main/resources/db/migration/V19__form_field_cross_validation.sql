-- Field-level cross-validation, in two parts:
-- 1. Conditional required: "if <requiredConditionFieldKey> matches, this field
--    becomes mandatory" - independent of the static is_required flag.
-- 2. Cross-field comparison: "this field's value must be >, >=, <, <=, =, or
--    != another field's value" (e.g. end_date >= start_date), with a custom
--    error message.
ALTER TABLE form_field ADD COLUMN required_condition_field_key VARCHAR(100);
ALTER TABLE form_field ADD COLUMN required_condition_operator VARCHAR(20);
ALTER TABLE form_field ADD COLUMN required_condition_value VARCHAR(500);

ALTER TABLE form_field ADD COLUMN cross_validate_field_key VARCHAR(100);
ALTER TABLE form_field ADD COLUMN cross_validate_operator VARCHAR(30);
ALTER TABLE form_field ADD COLUMN cross_validate_message VARCHAR(300);
