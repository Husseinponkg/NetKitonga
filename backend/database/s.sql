CREATE DATABASE one;


\c one;
-- 1. GLOBAL SYSTEM OWNER (ADMINS)
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TENANTS (BUSINESS USERS / MULTI-TENANCY OWNER ROOT)
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    system_name VARCHAR(100) DEFAULT 'My Hotspot Billing', -- White-label name
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BRANCHES (BUSINESS LOCATIONS PER TENANT)
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_name VARCHAR(100) NOT NULL,
    branch_location VARCHAR(255) NOT NULL,
    branch_email VARCHAR(150) NOT NULL UNIQUE,
    branch_phone VARCHAR(20) NOT NULL,
    branch_manager VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. UNIVERSAL ROUTERS (SUPPORTS MIKROTIK & RUIJIE/WIFIDOG)
CREATE TABLE routers (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    router_name VARCHAR(100) NOT NULL,
    
    -- Driver Type Strategy Engine
    driver_type VARCHAR(50) NOT NULL, -- 'mikrotik_radius' OR 'ruijie_wifidog'
    
    -- MikroTik RADIUS Properties
    nas_identifier VARCHAR(100) NULL UNIQUE, -- Identifies MikroTik inside FreeRADIUS
    radius_secret VARCHAR(100) NULL,        -- Asymmetric authentication key
    
    -- Ruijie/Wifidog Properties
    gw_id VARCHAR(100) NULL UNIQUE,         -- Identifies Ruijie during HTTP Handshakes
    
    -- Shared Network Telemetry & Licensing
    mac_address VARCHAR(50) NOT NULL UNIQUE,
    is_licensed BOOLEAN DEFAULT TRUE,        -- Enforces router addition limits
    status VARCHAR(20) DEFAULT 'offline',    -- 'online', 'offline'
    last_heartbeat_at TIMESTAMP NULL,        -- Dynamic monitoring update window
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PACKAGES (TENANT CUSTOM INTERNET BUNDLES)
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    package_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_seconds INT NOT NULL,           -- Access window (e.g. 3600 for 1 hour)
    data_quota_bytes BIGINT DEFAULT 0,       -- 0 means completely Unlimited
    
    -- MikroTik Rate Limits (Sent via RADIUS Attributes)
    mikrotik_rate_limit VARCHAR(50) NULL,    -- Example: '5M/2M' (Down/Up)
    
    -- Ruijie / Wifidog Rate Limits (Sent via HTTP XML Response Payload)
    wifidog_max_down_bandwidth INT NULL,     -- Bytes per second speed ceiling
    wifidog_max_up_bandwidth INT NULL,       -- Bytes per second speed ceiling
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 ALTER TABLE  packages ADD COLUMN  description VARCHAR(100);
ALTER TABLE packages ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- 5b. VOUCHERS (TENANT PACKAGE ACCESS CODES)
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    package_id INT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'unused',
    expires_at TIMESTAMP NULL,
    redeemed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vouchers_tenant_id ON vouchers(tenant_id);
-- 6. BUYERS (END-CONSUMERS DISCOVERED AT PORTAL)
CREATE TABLE buyers (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    buyer_mac VARCHAR(50) NOT NULL,          -- Identifies device block downstream
    phone_number VARCHAR(30) NULL,           -- Saved consumer phone number
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, buyer_mac)            -- Scope isolation parameter
);

-- 7. PAYMENTS (FINANCIAL & ROUTER ROUTING MAP)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    router_id INT NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
    package_id INT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    
    amount DECIMAL(10, 2) NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL,    -- 'M-Pesa', 'Stripe', 'Tigo-Pesa'
    gateway_reference VARCHAR(150) NOT NULL UNIQUE, -- Prevents duplicate checkouts
    status VARCHAR(30) DEFAULT 'pending',    -- 'pending', 'completed', 'failed'
    
    -- Network Unlock Mechanism Token
    auth_token VARCHAR(255) NOT NULL UNIQUE, -- Sent back to clear login blocks
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. ACTIVE SESSIONS (REAL-TIME LIVE ONLINE CONNECTIONS)
CREATE TABLE active_sessions (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    router_id INT NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
    buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    payment_id INT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    session_id VARCHAR(150) NOT NULL UNIQUE, -- RADIUS Acct-Session-Id or Wifidog Token
    assigned_ip VARCHAR(45) NOT NULL,
    bytes_uploaded BIGINT DEFAULT 0,
    bytes_downloaded BIGINT DEFAULT 0,
    
    start_time TIMESTAMP NOT NULL,
    expiration_time TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'active'      -- 'active', 'terminated'
);

-- 9. TENANT WALLETS (LEDGER TRACKING FINANCIAL ENTITIES)
CREATE TABLE tenant_wallets (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    total_earned DECIMAL(12, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0.00,
    current_balance DECIMAL(12, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. WITHDRAWALS (MOBILE MONEY CASHOUT REQUESTS)
CREATE TABLE withdrawals (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    wallet_id INT NOT NULL REFERENCES tenant_wallets(id) ON DELETE CASCADE,
    
    amount DECIMAL(10, 2) NOT NULL,
    mobile_money_number VARCHAR(30) NOT NULL,
    payout_provider VARCHAR(50) NOT NULL,    -- 'Vodacom M-Pesa', 'AirtelMoney'
    transaction_reference VARCHAR(150) NULL, -- Cleared by Admin on execution
    status VARCHAR(30) DEFAULT 'pending',    -- 'pending', 'approved', 'rejected'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
