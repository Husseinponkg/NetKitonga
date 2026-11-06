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

-- Subscription payment ledger for completed recurring revenue
CREATE TABLE IF NOT EXISTS subscription_payments (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    payment_reference VARCHAR(150) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_status
    ON subscription_payments(status);

ALTER TABLE withdrawals
    ADD COLUMN IF NOT EXISTS system_commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS azampay_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

UPDATE withdrawals
SET system_commission_amount = ROUND(amount * 0.024, 2),
    azampay_fee_amount = ROUND(amount * 0.011, 2)
WHERE commission > 0
  AND system_commission_amount = 0
  AND azampay_fee_amount = 0;

CREATE TABLE IF NOT EXISTS system_cashouts (
    id SERIAL PRIMARY KEY,
    admin_id INT NULL REFERENCES admins(id) ON DELETE SET NULL,
    gross_amount NUMERIC(12, 2) NOT NULL CHECK (gross_amount > 0),
    fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
    net_amount NUMERIC(12, 2) NOT NULL CHECK (net_amount > 0),
    recipient_number VARCHAR(30) NOT NULL,
    payout_provider VARCHAR(50) NOT NULL,
    external_reference VARCHAR(150) NOT NULL UNIQUE,
    transaction_reference VARCHAR(150) NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    CHECK (gross_amount = fee_amount + net_amount)
);

CREATE INDEX IF NOT EXISTS idx_system_cashouts_status
    ON system_cashouts(status);

CREATE INDEX IF NOT EXISTS idx_system_cashouts_created_at
    ON system_cashouts(created_at);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'netkitonga_user') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE ON system_cashouts TO netkitonga_user';
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE system_cashouts_id_seq TO netkitonga_user';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE ON subscription_payments TO netkitonga_user';
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE subscription_payments_id_seq TO netkitonga_user';
    END IF;
END $$;
