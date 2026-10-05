-- Run this file against your existing database to add missing columns and fix schema drift.
-- Connect to the database first, for example:
--   psql -U postgres -d one -f backend/database/migrations/migrate.sql

-- Routers: ip_address
ALTER TABLE routers
    ADD COLUMN IF NOT EXISTS ip_address INET;

UPDATE routers
SET ip_address = '0.0.0.0'
WHERE ip_address IS NULL;

ALTER TABLE routers
    ALTER COLUMN ip_address SET NOT NULL;

-- Routers: is_licensed
ALTER TABLE routers
    ADD COLUMN IF NOT EXISTS is_licensed BOOLEAN DEFAULT TRUE;

UPDATE routers
SET is_licensed = TRUE
WHERE is_licensed IS NULL;

-- Routers: last_heartbeat_at
ALTER TABLE routers
    ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP NULL;

-- Routers: branch_id (if missing from old schema)
ALTER TABLE routers
    ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE CASCADE;

-- Packages: description
ALTER TABLE packages
    ADD COLUMN IF NOT EXISTS description VARCHAR(100);

-- Packages: status
ALTER TABLE packages
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Branches: ensure router credentials exist
ALTER TABLE branches
    ADD COLUMN IF NOT EXISTS router_username VARCHAR(100) NULL UNIQUE;

ALTER TABLE branches
    ADD COLUMN IF NOT EXISTS router_password VARCHAR(255) NULL;

-- Branches: ensure location and manager exist
ALTER TABLE branches
    ADD COLUMN IF NOT EXISTS branch_location VARCHAR(255);

ALTER TABLE branches
    ADD COLUMN IF NOT EXISTS branch_manager VARCHAR(100);

-- Fix payment_gateway if it was created as enum instead of varchar
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payment_gateway_enum'
    ) THEN
        ALTER TABLE payments
            ALTER COLUMN payment_gateway TYPE VARCHAR(50)
            USING payment_gateway::text;
    END IF;
END $$;

-- Ensure payment_gateway is varchar
ALTER TABLE payments
    ALTER COLUMN payment_gateway TYPE VARCHAR(50);
