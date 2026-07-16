-- Run once on an existing database before the restored secure card code.
-- Old merged-version ciphertext is incompatible with AES-256-GCM.
-- This clears only stored cards and mailing addresses, not users/passwords.

BEGIN;
ALTER TABLE credit_cards ALTER COLUMN billing_address TYPE TEXT;
TRUNCATE TABLE credit_cards RESTART IDENTITY;
UPDATE users SET mailing_address = NULL WHERE mailing_address IS NOT NULL;
COMMIT;
