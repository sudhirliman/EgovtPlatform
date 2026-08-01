-- Adds username-based login support (SRS: login accepts either username or mobile).
-- This is a NEW migration rather than an edit to V2, because V2 may already be
-- applied in existing environments - Flyway rejects edits to already-applied
-- migrations (checksum mismatch), so schema changes after the fact always go
-- in a new file like this one.
ALTER TABLE app_user ADD COLUMN username VARCHAR(50) UNIQUE;
