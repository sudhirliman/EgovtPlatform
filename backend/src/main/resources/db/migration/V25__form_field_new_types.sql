-- New field types: stored as VARCHAR so no ALTER TYPE needed.
-- Add bilingual label and full-width layout columns.
ALTER TABLE form_field ADD COLUMN IF NOT EXISTS label_marathi VARCHAR(200);
ALTER TABLE form_field ADD COLUMN IF NOT EXISTS full_width BOOLEAN NOT NULL DEFAULT FALSE;
