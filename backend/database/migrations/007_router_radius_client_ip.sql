ALTER TABLE routers
    ADD COLUMN IF NOT EXISTS radius_client_ip INET NULL;
