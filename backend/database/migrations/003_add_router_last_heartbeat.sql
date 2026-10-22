-- Apply this migration to an existing database before deploying the API change.
ALTER TABLE routers
    ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP NULL;
