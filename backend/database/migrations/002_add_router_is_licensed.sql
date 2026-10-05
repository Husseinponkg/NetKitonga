-- Apply this migration to an existing database before deploying the API change.
ALTER TABLE routers
    ADD COLUMN IF NOT EXISTS is_licensed BOOLEAN DEFAULT TRUE;

UPDATE routers
SET is_licensed = TRUE
WHERE is_licensed IS NULL;
