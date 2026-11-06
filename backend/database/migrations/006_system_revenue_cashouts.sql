-- Apply after 005_create_subscription_payments.sql.
-- Backfills the agreed 2.4% NetKitonga share and 1.1% AzamPay fee for
-- historic withdrawal rows that recorded a 3.5% combined commission.
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
