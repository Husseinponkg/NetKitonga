-- Apply this migration to an existing database before deploying the API change.
ALTER TABLE routers
    ADD COLUMN IF NOT EXISTS ip_address INET;

UPDATE routers
SET ip_address = '0.0.0.0'
WHERE ip_address IS NULL;

ALTER TABLE routers
    ALTER COLUMN ip_address SET NOT NULL;