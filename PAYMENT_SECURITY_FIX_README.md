# Apply the payment-card and security fix

1. Keep your existing local `ces-backend/.env` file. It is intentionally excluded from the patched ZIP.
2. In `ces-backend`, generate a key:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Add it to `.env`:

```env
CARD_ENCRYPTION_KEY=the_64_character_result
```

4. Migrate the current database:

```powershell
psql -U swe_user -d swe_db -f ces-backend/security_migration.sql
```

This clears only old card/address ciphertext because the merged version used an incompatible format. It does not delete users, passwords, movies, or favorites.

5. Restart backend and frontend.

6. Test with `4242 4242 4242 4242`, a future expiry, and a fake billing address. Confirm `11` is rejected, only the last four digits appear, edit/delete work, and the fourth card is blocked.

7. Verify ciphertext:

```sql
SELECT card_id, user_id, card_number, billing_address FROM credit_cards;
```
