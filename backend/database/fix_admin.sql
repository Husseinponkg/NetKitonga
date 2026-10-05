-- Fix admin password hash in netkitonga database
-- Run this in psql or pgAdmin while connected to netkitonga

-- Delete old plaintext admin
DELETE FROM admins WHERE email = 'obumehussein8@gmail.com';

-- Insert admin with proper bcrypt hash for password: A002#tz1
INSERT INTO admins (name, email, password_hash)
VALUES (
  'Hussein',
  'obumehussein8@gmail.com',
  '$2b$12$fQblM8r/.LaZayTAUprInOF8CrdYt3oMq7vYxGJ1GwZ1DqptBfcfm'
);

-- Verify the hash is stored correctly
SELECT id, name, email, LEFT(password_hash, 30) AS hash_prefix FROM admins;
