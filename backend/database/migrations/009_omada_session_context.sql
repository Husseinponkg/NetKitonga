CREATE TABLE IF NOT EXISTS omada_client_sessions (
    session_id VARCHAR(150) PRIMARY KEY
        REFERENCES active_sessions(session_id) ON DELETE CASCADE,
    client_mac VARCHAR(17) NOT NULL,
    site VARCHAR(128) NOT NULL,
    ssid_name VARCHAR(128) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'netkitonga_user') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON omada_client_sessions TO netkitonga_user';
    END IF;
END $$;
