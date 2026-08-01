ALTER TABLE role
  ADD COLUMN level        INTEGER      NOT NULL DEFAULT 99,
  ADD COLUMN display_name VARCHAR(100),
  ADD COLUMN description  VARCHAR(500);

UPDATE role SET level = 1,  display_name = 'Super Admin',            description = 'Full system administration'   WHERE name = 'SUPERADMIN';
UPDATE role SET level = 10, display_name = 'Initial Officer',        description = 'Initial scrutiny officer'      WHERE name = 'CFC_IO';
UPDATE role SET level = 11, display_name = 'Assistant Senior Clerk', description = 'Clerk scrutiny officer'        WHERE name = 'CFC_CLERK';
UPDATE role SET level = 12, display_name = 'Estate Manager',         description = 'Estate management officer'     WHERE name = 'CFC_EM';
