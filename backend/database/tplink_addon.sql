-- TP-LINK EAP225 ADDON TABLE
CREATE TABLE IF NOT EXISTS tplink (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    router_id INT NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    mac_address VARCHAR(50) NOT NULL,
    ip_address INET NOT NULL,
    nas_identifier VARCHAR(100) NULL,
    radius_secret VARCHAR(100) NULL,
    portal_url VARCHAR(255) NULL,
    status VARCHAR(20) DEFAULT 'offline',
    last_heartbeat_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, mac_address)
);
CREATE INDEX IF NOT EXISTS idx_tplink_tenant_id ON tplink(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tplink_router_id ON tplink(router_id);
