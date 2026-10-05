-- Apply this migration to an existing database before deploying the API change.
ALTER TABLE packages
    ADD COLUMN IF NOT EXISTS description VARCHAR(100);

ALTER TABLE packages
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
