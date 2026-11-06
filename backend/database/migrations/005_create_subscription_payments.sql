-- Apply this migration to an existing database before deploying subscription billing.
-- Run this before 006_system_revenue_cashouts.sql.
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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'netkitonga_user') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE ON subscription_payments TO netkitonga_user';
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE subscription_payments_id_seq TO netkitonga_user';
    END IF;
END $$;
