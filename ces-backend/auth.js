const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail, sendProfileUpdateEmail } = require('./email');
const { authenticate } = require('./middleware');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return null;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption failed:', err);
    return text;
  }
}

function expiryToDate(mmYy) {
  if (!mmYy || !String(mmYy).trim()) return null;
  const match = String(mmYy).trim().match(/^(\d{1,2})\s*\/\s*(\d{2})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function dateToExpiry(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${month}/${year}`;
}

function validateNewPassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

module.exports = function (pool) {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const { firstName, lastName, email, phone, password, subscribeToPromotions } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const passwordError = validateNewPassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    try {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await hashPassword(password);
      const verifyToken = crypto.randomBytes(32).toString('hex');

      await pool.query(
        `INSERT INTO users
           (email, password_hash, first_name, last_name, phone_number, role, status,
            promotional_emails, email_confirmation_token)
         VALUES ($1, $2, $3, $4, $5, 'customer', 'Inactive', $6, $7)`,
        [email, passwordHash, firstName, lastName, phone || null,
         subscribeToPromotions === true, verifyToken]
      );

      await sendVerificationEmail(email, verifyToken);

      res.status(201).json({
        message: 'Account created! Please check your email to verify your account before logging in.',
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  router.post('/verify/:token', async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE users
            SET status = 'Active',
                email_confirmed_at = CURRENT_TIMESTAMP,
                email_confirmation_token = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE email_confirmation_token = $1
          RETURNING user_id`,
        [req.params.token]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or already-used verification link.' });
      }
      res.json({ message: 'Account verified! You can now log in.' });
    } catch (err) {
      console.error('Verification error:', err);
      res.status(500).json({ error: 'Verification failed.' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const user = result.rows[0];

      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (user.status !== 'Active') {
        return res.status(403).json({
          error: 'Account is not verified. Please check your email to verify your account.',
        });
      }

      const token = jwt.sign(
        { userId: user.user_id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '1d' }
      );

      res.json({
        token,
        user: {
          userId: user.user_id,
          firstName: user.first_name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  });

  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
      const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);

      const genericMsg = { message: 'If that email is registered, a reset link has been sent.' };
      if (result.rows.length === 0) return res.json(genericMsg);

      const userId = result.rows[0].user_id;
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '1 hour')`,
        [userId, tokenHash]
      );

      await sendPasswordResetEmail(email, rawToken);
      res.json(genericMsg);
    } catch (err) {
      console.error('Forgot-password error:', err);
      res.status(500).json({ error: 'Could not process request.' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const passwordError = validateNewPassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const result = await pool.query(
        `SELECT token_id, user_id FROM password_reset_tokens
          WHERE token_hash = $1
            AND expires_at > CURRENT_TIMESTAMP
            AND used_at IS NULL`,
        [tokenHash]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
      }

      const { token_id, user_id } = result.rows[0];
      const passwordHash = await hashPassword(newPassword);

      await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [passwordHash, user_id]
      );
      await pool.query(
        `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_id = $1`,
        [token_id]
      );

      res.json({ message: 'Password updated! You can now log in with your new password.' });
    } catch (err) {
      console.error('Reset-password error:', err);
      res.status(500).json({ error: 'Could not reset password.' });
    }
  });

  router.put('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    const passwordError = validateNewPassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    try {
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const currentOk = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!currentOk) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      if (await bcrypt.compare(newPassword, result.rows[0].password_hash)) {
        return res.status(400).json({ error: 'New password must be different from the current password.' });
      }

      const passwordHash = await hashPassword(newPassword);
      await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [passwordHash, userId]
      );

      res.json({ message: 'Password changed successfully!' });
    } catch (err) {
      console.error('Change-password error:', err);
      res.status(500).json({ error: 'Could not change password.' });
    }
  });

  router.get('/profile', authenticate, async (req, res) => {
    const userId = req.user.userId;

    try {
      const result = await pool.query(
        `SELECT first_name, last_name, email, phone_number, promotional_emails, mailing_address
         FROM users WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      const cardsResult = await pool.query(
        `SELECT card_number, expiration_date
         FROM credit_cards
         WHERE user_id = $1
         ORDER BY card_id
         LIMIT 3`,
        [userId]
      );

      const cards = cardsResult.rows;
      res.json({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone_number,
        subscribe_to_promotions: user.promotional_emails,
        address: decrypt(user.mailing_address),
        card1_num: decrypt(cards[0]?.card_number),
        card1_expiry: dateToExpiry(cards[0]?.expiration_date),
        card2_num: decrypt(cards[1]?.card_number),
        card2_expiry: dateToExpiry(cards[1]?.expiration_date),
        card3_num: decrypt(cards[2]?.card_number),
        card3_expiry: dateToExpiry(cards[2]?.expiration_date),
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.put('/profile', authenticate, async (req, res) => {
    const {
      firstName, lastName, phone, subscribeToPromotions, address,
      card1Num, card1Expiry, card2Num, card2Expiry, card3Num, card3Expiry,
    } = req.body;
    const userId = req.user.userId;
    const email = req.user.email;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First and last name are required.' });
    }

    const cardInputs = [
      { num: card1Num, expiry: card1Expiry },
      { num: card2Num, expiry: card2Expiry },
      { num: card3Num, expiry: card3Expiry },
    ];

    const cardsToSave = [];
    for (const card of cardInputs) {
      const num = card.num ? String(card.num).trim() : '';
      if (!num) continue;
      const expirationDate = expiryToDate(card.expiry);
      if (!expirationDate) {
        return res.status(400).json({ error: 'Each payment card needs a valid expiry in MM/YY format.' });
      }
      cardsToSave.push({ num, expirationDate });
    }

    if (cardsToSave.length > 3) {
      return res.status(400).json({ error: 'Users may store at most 3 payment cards.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE users
         SET first_name = $1,
             last_name = $2,
             phone_number = $3,
             promotional_emails = $4,
             mailing_address = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6`,
        [
          firstName,
          lastName,
          phone || null,
          subscribeToPromotions === true,
          encrypt(address),
          userId,
        ]
      );

      await client.query('DELETE FROM credit_cards WHERE user_id = $1', [userId]);

      for (const card of cardsToSave) {
        await client.query(
          `INSERT INTO credit_cards (user_id, card_number, expiration_date, billing_address)
           VALUES ($1, $2, $3, $4)`,
          [userId, encrypt(card.num), card.expirationDate, address || null]
        );
      }

      await client.query('COMMIT');
      await sendProfileUpdateEmail(email);
      res.json({ message: 'Profile updated successfully!' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating profile:', err);
      res.status(500).json({ error: 'Could not update profile' });
    } finally {
      client.release();
    }
  });

  return router;
};
