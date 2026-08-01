-- Conditional visibility for form fields: a field can be shown only when
-- another field in the same form matches a condition (e.g. show "Caste
-- Certificate Number" only when "category" is SC/ST/OBC).
ALTER TABLE form_field ADD COLUMN condition_field_key VARCHAR(100);
ALTER TABLE form_field ADD COLUMN condition_operator VARCHAR(20);
ALTER TABLE form_field ADD COLUMN condition_value VARCHAR(500);
